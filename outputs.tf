output "lambda_name" {
  description = "Name of the Lambda function."
  value       = aws_lambda_function.later_schedule_validator.function_name
}

output "default_base_url" {
  description = "Base URL for API Gateway."
  value       = aws_apigatewayv2_stage.utility_lambdas_default.invoke_url
}
