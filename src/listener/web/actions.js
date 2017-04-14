/**
* @Author: Ke Shen <godzilla>
* @Date:   2017-04-14 07:07:51
* @Email:  keshen@sohu-inc.com
* @Last modified by:   godzilla
* @Last modified time: 2017-04-14 07:07:51
*/


module.exports = {
    parseDomain: function (url) {
        if (url.indexOf('m.sohu.com') >= 0) return 'm.sohu.com';
        if (url.indexOf('focus-beijing-zhibo-detail') >= 0) return 'm.zhibo.focus.cn';
        if (url.indexOf('focus.cn') >= 0) return 'focus.cn';
        if (url.indexOf('sogou.com') >= 0) return 'sogou.com';
        if (url.indexOf('127.0.0.1') >= 0) return 'demo';
    },
    parseAction: function (domain, action) {
        if (domain === 'm.sohu.com') {
            if (action.indexOf('在吗') >= 0)
                return 'open';
            if (action.indexOf('退下') >= 0)
                return 'close';
            return 'alias';
        }
        if (domain === 'm.zhibo.focus.cn') return 'postDanmu';
        if (domain === 'focus.cn') {
            if (action.indexOf('登录') >= 0 || action.indexOf('登陆') >= 0)
                return 'loginStart';
            if (action.indexOf('明月') >= 0)
                return 'loginSuccess';
            if (action.indexOf('我要找房') >= 0 || action.indexOf('搜索') >= 0)
                return 'search';
            return 'query';
        }
        if (domain === 'demo') {
            return 'login';
        }
        return action;
    },
    responseDecor: {
        'm.sohu.com': {
            'open': function () {
                return '我一直在';
            },
            'close': function () {
                return '我隐身了';
            },
            'alias': function (text) {
                return text;
            }
        },
        'm.zhibo.focus.cn': {
            'postDanmu': function (text) {
                text = text.replace('，', '');
                return text;
            }
        },
        'focus.cn': {
            'query': function (text) {
                return '查找' + text;
            },
            'search': function (text) {
                return '为您查找房源';
            },
            'loginStart': function (text) {
                return '如您忘记密码，请朗诵春江花月夜第二句'
            },
            'loginSuccess': function (text) {
                return '声纹匹配成功';
            }
        },
        'demo': {
            'login': function () {}
        }
    },
    domainActions: {
        'm.sohu.com': {
            'open': function (data) {
                var req = data.re;
                var res = data.body;
                return `var siqiContainer = document.querySelector("#siqiContainer");siqiContainer.className="show";var siqiContainer = document.querySelector("#siqiContainer #main");siqiContainer.innerHTML='<div class=wrap-l><div class=item>${res}</div></div>'+'<div class=wrap-r><div class=item>${req}</div></div>'+siqiContainer.innerHTML;`;
            },
            'close': function (data) {
                var req = data.re;
                var res = data.body;
                return `var siqiContainer = document.querySelector("#siqiContainer");siqiContainer.className="";var siqiContainer = document.querySelector("#siqiContainer #main");siqiContainer.innerHTML='<div class=wrap-l><div class=item>${res}</div></div>'+'<div class=wrap-r><div class=item>${req}</div></div>'+siqiContainer.innerHTML;`;
            },
            'alias': function (data) {
                var req = data.re;
                var res = data.body;
                if (req.indexOf('热门') >= 0 || req.indexOf('头条') >= 0) {
                    data.body = '';
                    res = '<a href="/n/488442936/?wscrid=15084_1">习近平对廖俊波事迹作指示</a>'
                        + '<br><a href="/n/488442214/?wscrid=53939_1">4月17日起国航暂停平壤航线</a>'
                        + '<br><a href="/n/488419616/?wscrid=1137_1">宁波原市长受贿1.47亿 当庭认罪悔罪</a>'
                        + '<br><a href="/n/488334707/?wscrid=1137_6">多家公司股价再现闪崩 谁是幕后凶手</a>'
                        + '<br><a href="/n/488338971/?wscrid=1140_7">楼市被严格限购 你的钱该投向哪里?</a>';
                } else if (req.indexOf('历史') >= 0) {
                    data.body = '';
                    res = '<a href="https://beijing.focus.cn/">北京房地产_北京房产网_北京房产信息网-北京搜狐焦点网</a>'
                        + '<br><a href="https://m.zhibo.focus.cn/beijing/zhibo/12359.html?from=list">[焦点直播看房]近期的热门楼盘</a>'
                        + '<br><a href="https://beijing.focus.cn/">北京房地产_北京房产网_北京房产信息网-北京搜狐焦点网</a>'
                        + '<br><a href="https://m.sohu.com/">手机搜狐网</a>';
                }
                return `var siqiContainer = document.querySelector("#siqiContainer #main");siqiContainer.innerHTML='<div class=wrap-l><div class=item>${res}</div></div>'+'<div class=wrap-r><div class=item>${req}</div></div>'+siqiContainer.innerHTML;`;
            }
        },
        'm.zhibo.focus.cn': {
            'postDanmu': function (data) {
                var userName = '蘅芜散人';
                var comment = data.body;
                return `var commentListDiv=document.getElementById("commentList");commentListDiv.innerHTML+='<div class="focus-beijing-zhibo-detail-chat-div7"><div class="focus-beijing-zhibo-detail-chat-div8"><span class="focus-beijing-zhibo-detail-chat-span2">${userName}：</span><span class="focus-beijing-zhibo-detail-chat-span3">${comment}</span></div></div>';commentListDiv.scrollTop=commentListDiv.offsetHeight;`;
            }
        },
        'focus.cn': {
            'query': function (data) {
                var text = data.body;
                if (text.indexOf('海淀') >= 0)
                    return 'window.location.href="/loupan/q6/";';
                if (text.indexOf('别墅') >= 0)
                    return 'window.location.href="/loupan/q6_w7/";';
                return '';
            },
            'search': function (data) {
                return 'window.location.href="/loupan/";';
            },
            'loginStart': function () {
                return '';
            },
            'loginSuccess': function () {
                return 'document.cookie="IPLOC=CN1100; SUV=1704090108033127; ppinf=MXwxNDkxNjczMzMwMDE0fDE0OTQyNjUzMzAwMTR8MTQzMDUxODk1fHBwYWc4MDI5NDFiZGFhOWNAc29odS5jb20; pprdig=pZmPeoguF55CNXEHE7rnZsDkEwjjajpBurMyrv6TpTo3tYn4oStvk8jnt1qEWn0ZpoDEioBB6NJjQgt9nA+FLibQZgZz47bgGy5kLkvvD9pD21FTif9+//Y68aZsaByIo2fnmDFdGaPCTqwcKrnmweUbLb35jntade/Ot49GE2I; focusinf=MTQzMDUxODk1; pc_ad_feed=0; ad_strw=46e; focusbels=1; focus_pc_city_p=beijing; focus_city_p=beijing; focus_city_c=110100; focus_city_s=beijing";window.location.reload();';
            }
        },
        'demo': {
            'login': function () {}
        }
    }
};
