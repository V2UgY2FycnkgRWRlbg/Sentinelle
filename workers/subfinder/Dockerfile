FROM golang:1.19-alpine

RUN apk add --no-cache git
RUN go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@v2.5.5

ENTRYPOINT ["subfinder"]
