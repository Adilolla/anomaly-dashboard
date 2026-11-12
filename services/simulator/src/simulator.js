const api = process.env.API_URL || 'http://localhost:3000';
const interval = Number(process.env.SIMULATOR_INTERVAL_MS || 2500);
const scenarios = [
  { component_id: 'left_knee', component_name: 'Left Knee Actuator', fault_code: 'LEFT_KNEE_MOTOR_OVERHEAT', base: { cpu_usage: .38, memory_usage: .44, disk_io: .28, network_latency: .08, error_rate: .02, request_rate: .35 }, fault: { cpu_usage: .55, memory_usage: .52, disk_io: .8, network_latency: .12, error_rate: .18, request_rate: .72 } },
  { component_id: 'right_shoulder', component_name: 'Right Shoulder Actuator', fault_code: 'RIGHT_SHOULDER_CURRENT_SPIKE', base: { cpu_usage: .34, memory_usage: .42, disk_io: .25, network_latency: .07, error_rate: .02, request_rate: .3 }, fault: { cpu_usage: .58, memory_usage: .5, disk_io: .88, network_latency: .1, error_rate: .12, request_rate: .7 } },
  { component_id: 'battery_pack', component_name: 'Battery Pack', fault_code: 'BATTERY_VOLTAGE_SAG', base: { cpu_usage: .3, memory_usage: .4, disk_io: .2, network_latency: .06, error_rate: .01, request_rate: .28 }, fault: { cpu_usage: .72, memory_usage: .68, disk_io: .9, network_latency: .2, error_rate: .24, request_rate: .62 } },
  { component_id: 'vision_stack', component_name: 'Vision Sensor Stack', fault_code: 'VISION_SENSOR_PACKET_LOSS', base: { cpu_usage: .48, memory_usage: .58, disk_io: .35, network_latency: .08, error_rate: .03, request_rate: .46 }, fault: { cpu_usage: .78, memory_usage: .76, disk_io: .45, network_latency: .75, error_rate: .62, request_rate: .22 } },
  { component_id: 'balance_imu', component_name: 'Balance IMU', fault_code: 'BALANCE_IMU_DRIFT', base: { cpu_usage: .36, memory_usage: .45, disk_io: .24, network_latency: .09, error_rate: .02, request_rate: .32 }, fault: { cpu_usage: .67, memory_usage: .58, disk_io: .6, network_latency: .3, error_rate: .48, request_rate: .2 } },
];
let tick = 0;
const jitter = (value) => Math.max(0, Math.min(1, value + (Math.random() - .5) * .04));
async function emit() {
  const scenario = scenarios[tick % scenarios.length];
  const faultActive = tick % 4 === 3;
  const profile = faultActive ? scenario.fault : scenario.base;
  const payload = { source: `ultron-${scenario.component_id}`, ...Object.fromEntries(Object.entries(profile).map(([key, value]) => [key, jitter(value)])), label: faultActive ? 'synthetic_fault' : 'synthetic_normal', metadata: { robot_id: 'ULTRON-01', robot_name: 'Ultron Humanoid', component_id: scenario.component_id, component_name: scenario.component_name, fault_code: faultActive ? scenario.fault_code : null, fault_active: faultActive, simulator_tick: tick, telemetry_profile: faultActive ? 'fault-injection' : 'nominal' } };
  try { const response = await fetch(`${api}/api/events`, { method: 'POST', headers: { 'content-type': 'application/json', 'Idempotency-Key': `ultron-${tick}` }, body: JSON.stringify(payload) }); if (!response.ok) console.error(await response.text()); else console.log(JSON.stringify({ event: 'ultron_telemetry_emitted', component: scenario.component_id, faultActive })); } catch (error) { console.error(error.message); }
  tick += 1;
}
setInterval(emit, interval); emit();
