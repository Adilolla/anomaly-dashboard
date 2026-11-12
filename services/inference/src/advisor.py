"""Free, deterministic repair advisor for the synthetic Ultron humanoid."""

ADVICE = {
    'left_knee': ('LEFT_KNEE_MOTOR_OVERHEAT', 'critical', 'Left knee actuator temperature and load are outside the learned operating envelope.', 'Reduce left-leg load, enter maintenance stance, and inspect the knee actuator cooling path.', 0.96),
    'right_shoulder': ('RIGHT_SHOULDER_CURRENT_SPIKE', 'warning', 'Right shoulder current is elevated relative to the commanded motion profile.', 'Limit right-arm torque and inspect the shoulder gearbox for binding.', 0.91),
    'battery_pack': ('BATTERY_VOLTAGE_SAG', 'critical', 'Power-bus voltage is sagging under load, which can destabilize the robot.', 'Switch to safe power mode and inspect the battery pack and power bus before resuming motion.', 0.98),
    'vision_stack': ('VISION_SENSOR_PACKET_LOSS', 'warning', 'The vision stack is losing sensor packets and may have degraded perception.', 'Restart the vision pipeline and inspect the camera/LiDAR network path.', 0.89),
    'balance_imu': ('BALANCE_IMU_DRIFT', 'critical', 'The balance IMU is drifting from the expected upright reference.', 'Freeze locomotion, recalibrate the IMU, and keep the robot in a stationary safe pose.', 0.94),
    'core_compute': ('CORE_COMPUTE_PRESSURE', 'warning', 'Core compute utilization is high enough to threaten inference latency.', 'Reduce nonessential workloads and inspect the inference worker queue depth.', 0.84),
}

def advise(metadata):
    component = (metadata or {}).get('component_id', 'core_compute')
    return ADVICE.get(component, ('UNKNOWN_HUMANOID_FAULT', 'info', 'Telemetry drift was detected in an unmapped subsystem.', 'Collect more telemetry before taking an automated action.', 0.55)) | {'component_id': component, 'component_name': (metadata or {}).get('component_name', component.replace('_', ' ').title())}
