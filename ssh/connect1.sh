#!/bin/bash

chmod 400 teste1.pem
ssh -i "teste1.pem" ec2-user@ec2-54-233-73-163.sa-east-1.compute.amazonaws.com
