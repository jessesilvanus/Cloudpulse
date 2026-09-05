# 4 Golden Signals & CloudWatch Adapter

## Real-Time Golden Signals Mapping

1. **Latency**:
   - Source: `AWS/ApplicationELB` `TargetResponseTime`
   - Reading: `42 ms` (P99: 68 ms) — Status: `HEALTHY`
2. **Traffic**:
   - Source: `AWS/ApplicationELB` `RequestCount`
   - Reading: `1,420 requests / 5min` — Status: `HEALTHY`
3. **Errors**:
   - Source: `AWS/ApplicationELB` `HTTPCode_Target_5XX_Count`
   - Reading: `0 Errors (0.00%)` — Status: `HEALTHY`
4. **Saturation**:
   - Source: `AWS/EC2` `CPUUtilization`
   - Primary Host: `4.8%` (`HEALTHY`) | Staging Host: `78.5%` (`DEGRADED`)
