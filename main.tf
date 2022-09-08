terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

variable "deployment_pkg_name" {
  type        = string
  description = "The deployment package file name to be consumed by the AWS Lambda service."
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_cloudwatch_log_group" "later_schedule_validator" {
  name              = "/aws/lambda/${aws_lambda_function.later_schedule_validator.function_name}"
  retention_in_days = 30
}

resource "aws_iam_role" "utility_lambdas" {
  name = "UtilityLambdasRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = ""
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "utility_lambdas_upload_logs" {
  role       = aws_iam_role.utility_lambdas.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "later_schedule_validator" {
  function_name    = "laterScheduleValidator"
  filename         = var.deployment_pkg_name
  source_code_hash = filebase64sha256(var.deployment_pkg_name)
  role             = aws_iam_role.utility_lambdas.arn
  handler          = "handler.laterScheduleValidator"
  runtime          = "nodejs16.x"
}

resource "aws_sns_topic_subscription" "conner_endpoint" {
  endpoint  = "conner@cavcrosby.tech"
  protocol  = "email"
  topic_arn = aws_sns_topic.email_me.id
}

resource "aws_sns_topic" "email_me" {
  name = "emailMe"
}

resource "aws_cloudwatch_metric_alarm" "utility_lambdas_api_count_alarm" {
  alarm_name          = "UtilityLambdasApiCountAlarm"
  alarm_description   = "This alarm monitors potential brute force attacks against the api gateway."
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "Count"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "15000"
  treat_missing_data  = "ignore"

  dimensions = {
    "ApiId" : aws_apigatewayv2_api.utility_lambdas.id
  }
  alarm_actions = [
    aws_sns_topic.email_me.id
  ]
}

resource "aws_cloudwatch_log_group" "utility_lambdas" {
  name              = "/aws/apigateway/${aws_apigatewayv2_api.utility_lambdas.name}"
  retention_in_days = 30
}

resource "aws_apigatewayv2_route" "later_schedue_validator" {
  api_id    = aws_apigatewayv2_api.utility_lambdas.id
  route_key = "POST /later-validator"
  target    = "integrations/${aws_apigatewayv2_integration.later_schedue_validator.id}"
}

resource "aws_apigatewayv2_integration" "later_schedue_validator" {
  api_id             = aws_apigatewayv2_api.utility_lambdas.id
  integration_uri    = aws_lambda_function.later_schedule_validator.invoke_arn
  integration_type   = "AWS_PROXY"
  integration_method = "POST"
}

resource "aws_lambda_permission" "utility_lambdas" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.later_schedule_validator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.utility_lambdas.execution_arn}/*/*"
}

resource "aws_apigatewayv2_stage" "utility_lambdas_default" {
  api_id = aws_apigatewayv2_api.utility_lambdas.id
  # Creates an identical '$default' stage for a api gateway, for reference on this
  # info:
  # https://stackoverflow.com/questions/66977149/how-can-i-create-a-default-deployment-stage-in-api-gateway-using-terraform#answer-68954899
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_api" "utility_lambdas" {
  name          = "utilityLambdasApi"
  protocol_type = "HTTP"
}
