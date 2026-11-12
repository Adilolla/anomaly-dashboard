import json, os, time, uuid
import mysql.connector
import redis
from config.settings import settings
from inference.model_loader import load_model, score
from inference.scoring import classify
from preprocessing.telemetry import vectorize

EVENT_STREAM = 'anomaly:events'; RESULT_STREAM = 'anomaly:results'; GROUP = 'inference-workers'

class InferenceWorker:
    def __init__(self, config=None, db=None, queue=None, model=None):
        self.config = config or settings(); self.db = db or mysql.connector.connect(host=self.config['DB_HOST'], port=int(self.config['DB_PORT']), user=self.config['DB_USER'], password=self.config['DB_PASSWORD'], database=self.config['DB_NAME'])
        self.queue = queue or redis.from_url(self.config['REDIS_URL'], decode_responses=True); self.model = model or load_model(self.config['MODEL_PATH'], self.config['ALLOW_BASELINE_MODEL']); self.threshold = float(self.config['ANOMALY_THRESHOLD'])
    def setup(self):
        try: self.queue.xgroup_create(EVENT_STREAM, GROUP, id='0', mkstream=True)
        except redis.ResponseError as error:
            if 'BUSYGROUP' not in str(error): raise
    def process(self, event_id):
        cursor = self.db.cursor(dictionary=True); cursor.execute('SELECT * FROM events WHERE id = %s', (event_id,)); event = cursor.fetchone()
        if not event: raise ValueError(f'event {event_id} does not exist')
        values = vectorize(event); anomaly_score = score(self.model, values); is_anomaly = classify(anomaly_score, self.threshold); run_id = str(uuid.uuid4())
        cursor.execute('INSERT IGNORE INTO inference_runs (id, event_id, model_version, status) VALUES (%s, %s, %s, \'running\')', (run_id, event_id, self.config['MODEL_VERSION']))
        cursor.execute('INSERT IGNORE INTO anomaly_results (event_id, model_version, anomaly_score, is_anomaly, threshold_used) VALUES (%s, %s, %s, %s, %s)', (event_id, self.config['MODEL_VERSION'], anomaly_score, is_anomaly, self.threshold))
        cursor.execute("UPDATE inference_runs SET status='succeeded', finished_at=CURRENT_TIMESTAMP(6) WHERE id=%s", (run_id,)); self.db.commit()
        self.queue.xadd(RESULT_STREAM, {'event_id': str(event_id), 'inference_run_id': run_id, 'model_version': self.config['MODEL_VERSION'], 'anomaly_score': str(anomaly_score), 'is_anomaly': '1' if is_anomaly else '0', 'threshold_used': str(self.threshold)})
    def run_once(self, consumer):
        messages = self.queue.xreadgroup(GROUP, consumer, {EVENT_STREAM: '>'}, count=10, block=5000)
        for _, entries in messages:
            for message_id, fields in entries:
                try: self.process(int(fields['event_id'])); self.queue.xack(EVENT_STREAM, GROUP, message_id)
                except Exception as error: print(json.dumps({'level':'error','event_id':fields.get('event_id'),'message':str(error)}), flush=True)
    def run(self):
        self.setup(); consumer = f'worker-{os.getpid()}'
        while True:
            try: self.run_once(consumer)
            except Exception as error: print(json.dumps({'level':'error','component':'inference','message':str(error)}), flush=True); time.sleep(2)

if __name__ == '__main__': InferenceWorker().run()
