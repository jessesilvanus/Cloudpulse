output "alarm_5xx_arn" {
  value = aws_cloudwatch_metric_alarm.alb_5xx.arn
}

output "alarm_latency_arn" {
  value = aws_cloudwatch_metric_alarm.alb_latency.arn
}
