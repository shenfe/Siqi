/**
* @Author: Ke Shen <godzilla>
* @Date:   2017-04-14 07:07:51
* @Email:  keshen@sohu-inc.com
* @Last modified by:   godzilla
* @Last modified time: 2017-04-14 07:07:51
*/


module.exports = {
    parseDomain: function (url) {
        if (url.indexOf('focus-beijing-zhibo-detail') >= 0) return 'm.zhibo.focus.cn';
        if (url.indexOf('focus.cn') >= 0) return 'focus.cn';
        if (url.indexOf('sogou.com') >= 0) return 'sogou.com';
        if (url.indexOf('127.0.0.1') >= 0) return 'demo';
    },
    parseAction: function (domain, action) {
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
    },
    responseDecor: {
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
