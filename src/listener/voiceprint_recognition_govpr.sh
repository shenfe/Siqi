#!/bin/sh

o_path=`pwd`
export GOPATH=$HOME/go
cd $GOPATH/src/github.com/liuxp0827/govpr/example
go run recognize.go ${o_path}/$1 ${o_path}/$2