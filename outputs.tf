// Currently aws_apigatewayv2_domain_name does not export the regional endpoint
// domain name, hence I have to use the following.
data "aws_api_gateway_domain_name" "utility_lambdas" {
  domain_name = var.lambda_fqdn
}

output "lambda_name" {
  description = "Name of the Lambda function."
  value       = aws_lambda_function.later_schedule_validator.function_name
}

output "custom_domain_regional_api_url" {
  description = "URL for the custom domain regional API endpoint on the API Gateway."
  value       = data.aws_api_gateway_domain_name.utility_lambdas.regional_domain_name
}

output "default_exec_base_url" {
  description = "Base URL for the execute API endpoint on the API Gateway."
  value       = aws_apigatewayv2_stage.utility_lambdas_default.invoke_url
}
