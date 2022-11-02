terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }
  cloud {
    organization = "cavcrosby"

    workspaces {
      name = "later-validator-lambda"
    }
  }

  required_version = ">= 1.2.0"
}

variable "aws_region" {
  type        = string
  description = "The AWS region to deploy project resources to."
}

# MONITOR(cavcrosby): appears there is a PR to integrate a pascal case function
# into Terraform. If merged I should look into using it, for reference on
# related github issue and PR:
# https://github.com/hashicorp/terraform/issues/25230
# https://github.com/hashicorp/terraform/pull/27357
variable "aws_region_pascal" {
  type        = string
  description = "The AWS region to deploy project resources to (in Pascal case)."
}

variable "deployment_pkg_name" {
  type        = string
  description = "The deployment package file name to be consumed by the AWS Lambda service."
}

variable "lambda_fqdn" {
  type        = string
  description = "The fully qualified domain name in which to access the lambda by."
}

variable "lambda_endpoint" {
  type        = string
  description = "The URL pattern appended to specify the lambda."
}

provider "aws" {
  region = var.aws_region
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

resource "aws_acm_certificate" "later_schedule_validator" {
  domain_name       = var.lambda_fqdn
  validation_method = "DNS"

  // Terraform docs recommend 'create_before_destroy' being set to replace a cert
  // currently in use.
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "later_schedule_validator" {
  certificate_arn = aws_acm_certificate.later_schedule_validator.arn
}

resource "aws_sns_topic_subscription" "conner_endpoint" {
  endpoint  = "conner@cavcrosby.tech"
  protocol  = "email"
  topic_arn = aws_sns_topic.email_me.id
}

resource "aws_sns_topic" "email_me" {
  name = "emailMe"
}

resource "aws_cloudwatch_metric_alarm" "utility_lambdas_api_invoke_count_alarm" {
  alarm_name          = "UtilityLambdasApiInvokeCountAlarm"
  alarm_description   = "This alarm monitors potential brute force attacks against this api."
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  datapoints_to_alarm = "1"
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

# All api gateways per region share a cloudwatch role. Hence it does not make
# sense to create a role assuming it will be isolated to this one api. For
# reference on the scope of this role:
# https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-logging.html#set-up-access-logging-permissions
resource "aws_iam_role" "regional_apigateway_cloudwatch" {
  name = "${var.aws_region_pascal}ApiGwRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = ""
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      },
    ]
  })
}

resource "aws_iam_role_policy_attachment" "regional_apigateway_cloudwatch" {
  role       = aws_iam_role.regional_apigateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "regional" {
  cloudwatch_role_arn = aws_iam_role.regional_apigateway_cloudwatch.arn
}

resource "aws_apigatewayv2_route" "later_schedue_validator" {
  api_id    = aws_apigatewayv2_api.utility_lambdas.id
  route_key = "POST ${var.lambda_endpoint}"
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

resource "aws_apigatewayv2_domain_name" "utility_lambdas" {
  domain_name = var.lambda_fqdn

  domain_name_configuration {
    certificate_arn = aws_acm_certificate_validation.later_schedule_validator.certificate_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_stage" "utility_lambdas_default" {
  api_id = aws_apigatewayv2_api.utility_lambdas.id
  # Creates an identical '$default' stage for a api gateway, for reference on this
  # info:
  # https://stackoverflow.com/questions/66977149/how-can-i-create-a-default-deployment-stage-in-api-gateway-using-terraform#answer-68954899
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_api_mapping" "utility_lambdas_default" {
  api_id      = aws_apigatewayv2_api.utility_lambdas.id
  domain_name = aws_apigatewayv2_domain_name.utility_lambdas.id
  stage       = aws_apigatewayv2_stage.utility_lambdas_default.id
}

resource "aws_apigatewayv2_api" "utility_lambdas" {
  name                         = "utilityLambdasApi"
  protocol_type                = "HTTP"
  disable_execute_api_endpoint = true
}
