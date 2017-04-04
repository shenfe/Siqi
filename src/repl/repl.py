# -*- coding:utf-8 -*-

import socket
import time

if __name__ == '__main__':
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    conn = '/tmp/conn'
    sock.connect(conn)
    time.sleep(2)

    txt = raw_input('')
    while txt:
        if txt != 'q':
            sock.send(txt)

        if txt == 'exit' or txt == 'q':
            sock.close()
            break

        res = sock.recv(1024)
        txt = raw_input(res + '\n')