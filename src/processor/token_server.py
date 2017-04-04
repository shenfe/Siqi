# -*- coding:utf-8 -*-

import socket
import os

import thulac

# TODO: how about using posix_ipc instead of socket?

if __name__ == '__main__':
    # 默认模式
    tokenizer = thulac.thulac()
    # 进行一句话分词
    # text = tokenizer.cut("我爱北京天安门", text=True)

    to_exit = False

    # create a UNIX (not INET), STREAMing socket
    sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    conn = '/tmp/conn'
    if not os.path.exists(conn):
        os.mknod(conn)
    if os.path.exists(conn):
        os.unlink(conn)
    sock.bind(conn)
    sock.listen(5)

    while not to_exit:
        connection, address = sock.accept()

        while True:
            try:
                data = connection.recv(1024)
            except Exception as e:
                print(e)
                connection.close()
                break
            if not data:
                break

            to_exit = (data == 'exit')
            if to_exit:
                print "exit"
                break

            print 'recv: %s\n' % data
            res = tokenizer.cut(data, text=True)
            connection.send(res)

        connection.close()
    sock.close()