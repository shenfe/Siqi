# -*- coding:utf-8 -*-

'''
ref: http://blog.csdn.net/wolfblood_zzx/article/details/46418635
'''

import urllib
import urllib2
import json
import base64

class BaiduRest:
    def __init__(self, cu_id, api_key, api_secret):
        # token认证的url
        self.token_url = 'https://openapi.baidu.com/oauth/2.0/token?grant_type=client_credentials&client_id=%s&client_secret=%s'
        # 语音合成的resturl
        self.getvoice_url = 'http://tsn.baidu.com/text2audio?tex=%s&lan=zh&cuid=%s&ctp=1&tok=%s'
        # 语音识别的resturl
        self.upvoice_url = 'http://vop.baidu.com/server_api'
        # cuid
        self.cu_id = cu_id

        # 获取token, 写入token_str
        self._getToken(api_key, api_secret)
        return

    def _getToken(self, api_key, api_secret):
        token_url = self.token_url % (api_key, api_secret)
        r_str = urllib2.urlopen(token_url).read()
        token_data = json.loads(r_str)
        self.token_str = token_data['access_token']
        pass

    def getVoice(self, text, filename):
        # 向Rest接口提交数据
        get_url = self.getvoice_url % (urllib.quote(text.encode('utf8')), self.cu_id, self.token_str)

        voice_data = urllib2.urlopen(get_url).read()

        # 处理返回数据
        voice_fp = open(filename, 'wb+')
        voice_fp.write(voice_data)
        voice_fp.close()
        pass

    def getText(self, filename):
        # 向Rest接口提交数据
        data = {}

        # 语音的一些参数
        data['format'] = 'wav'
        data['rate'] = 16000
        data['channel'] = 1
        data['cuid'] = self.cu_id
        data['token'] = self.token_str
        wav_fp = open(filename, 'rb')
        voice_data = wav_fp.read()
        data['len'] = len(voice_data)
        data['speech'] = base64.b64encode(voice_data).decode('utf-8')
        post_data = json.dumps(data)

        r_data = urllib2.urlopen(self.upvoice_url, post_data).read()

        # 处理返回数据
        res = json.loads(r_data)
        print res
        return res['result']

if __name__ == '__main__':
    cuid = '1491278011881'
    api_key = 'ynBXIwhm3xG4QvDuFrGOtaiB'
    api_secret = '51edadb50077bb6298a4fa00a6aeb1aa'

    # 1. 初始化
    print('init...')
    bdr = BaiduRest(cuid, api_key, api_secret)

    # 2. 语音合成: 将字符串语音合成并保存为out.mp3
    print('get voice of text...')
    bdr.getVoice(u'把无聊的世界变得有趣', 'out.mp3')

    # 3. 语音识别: 识别in.wav语音内容并显示
    print('get text of voice...')
    print(bdr.getText('in.wav'))
