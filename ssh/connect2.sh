#!/bin/bash

chmod 400 teste2.pem
ssh -i "teste2.pem" ec2-user@ec2-52-67-178-15.sa-east-1.compute.amazonaws.com
