# ── CloudWatch Alarm: High 5xx Error Rate ────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "alb_5xx" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-high-5xx"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Triggered when ALB target 5xx error count exceeds 10 requests per minute"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }
}

# ── CloudWatch Alarm: High Target Response Latency (>500ms) ───────────────────
resource "aws_cloudwatch_metric_alarm" "alb_latency" {
  alarm_name          = "${var.project_name}-${var.environment}-alb-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  extended_statistic  = "p99"
  threshold           = 0.5 # 500ms
  alarm_description   = "Triggered when P99 target response time exceeds 500ms"

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }
}

# ── CloudWatch Alarm: Unhealthy Target Count ──────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "unhealthy_targets" {
  alarm_name          = "${var.project_name}-${var.environment}-api-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Maximum"
  threshold           = 0
  alarm_description   = "Triggered when one or more API targets fail health checks"

  dimensions = {
    TargetGroup  = var.api_target_group_suffix
    LoadBalancer = var.alb_arn_suffix
  }
}

# ── CloudWatch SRE Executive Dashboard ───────────────────────────────────────
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-sre-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum", color = "#2ca02c" }]
          ]
          period = 60
          region = "us-east-1"
          title  = "Total Ingress Request Volume (RPS / min)"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.alb_arn_suffix, { stat = "Sum", color = "#d62728" }],
            [".", "HTTPCode_Target_4XX_Count", ".", ".", { stat = "Sum", color = "#ff7f0e" }]
          ]
          period = 60
          region = "us-east-1"
          title  = "Target HTTP Error Responses (4xx / 5xx)"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 24
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix, { stat = "p99", color = "#9467bd" }],
            [".", ".", ".", ".", { stat = "p50", color = "#1f77b4" }]
          ]
          period = 60
          region = "us-east-1"
          title  = "Target Response Latency (P50 vs P99)"
        }
      }
    ]
  })
}
