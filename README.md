# later-validator-lambda

An AWS Lambda that validates `Later` schedule expressions through an Amazon API
Gateway. Currently, the lambda works with the [Bree variant of Later](https://github.com/breejs/later).

## Usage Examples

```shell
curl --request POST \
    --header "Content-Type: application/json" \
    --data "every 5 mins" \
    "$(terraform output -raw api_url)"

curl --request POST \
    --header "Content-Type: application/json" \
    --data "every 5 hooplas" \
    "$(terraform output -raw api_url)"

curl --request POST \
    --header "Content-Type: application/json" \
    --data '{"schedule": "every 5 mins"}' \
    "$(terraform output -raw api_url)"

curl --request POST \
    --header "Content-Type: application/json" \
    --data '{"schedule": "every 5 mins", "date": "2013-03-23T10:30:00Z"}' \
    "$(terraform output -raw api_url)"

curl --request POST \
    --header "Content-Type: application/json" \
    --data '{"schedule": "every 5 mins", "date": "2013-03-23T11:17:00Z"}' \
    "$(terraform output -raw api_url)"

curl --request POST \
    --header "Content-Type: application/json" \
    --data '{"schedule": "every 5", "date": "2013-03-23T11:17:00Z"}' \
    "$(terraform output -raw api_url)"
```

## License

See LICENSE.
