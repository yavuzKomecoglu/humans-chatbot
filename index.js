var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data
var humansGraphQLSDK = require('./humansGraphQLSDK.js'); 

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.set('port', (process.env.PORT || 5000));
app.set('verify_token', (process.env.VERIFY_TOKEN || '123456'));
app.set('page_access_token', (process.env.PAGE_ACCESS_TOKEN || 'EAAEwdo5pZBLwBAEmKe284vUxYmSjLZCjU7KlO3SZAnJocCSlQh3QqaEs1xO3xmJqV8FAoeCSwHPmldQ7qaM8hugjTXSG7ZC5F7N5ZCUhTEyqkCYEaBTj0oHwJNZBkJdNdcJX9h5pVNANcxsXQFVS8amAmiExg1fP8YjSKcliO1wgZDZD'));

addSettingGreetingText();
//addHumantedButton();
addPersistentMenu();

app.get('/', function (req, res) {
    //res.send('It Works! Follow FB Instructions to activate.');
    res.sendFile(__dirname + '/index.html');
});

app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === app.get('verify_token')) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Error, wrong validation token, ' + req.query['hub.verify_token'] + "," + app.get('verify_token'));
    }
});

app.post('/webhook/', upload.array(), function (req, res, next) {
    messaging_events = req.body.entry[0].messaging;
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i];
        sender = event.sender.id;

        if (event.message && event.message.attachments && event.message.attachments.length > 0) {
            attachment = event.message.attachments[0];
            if (attachment.type === 'location') {
                console.log("audio URL: " + attachment.payload.coordinates);
            }
            else if (attachment.type === 'audio') {
                console.log("audio URL: " + attachment.payload.url);
            }
        }
        else if (event.postback) {
            text = event.postback.payload;
            if (text == "basla") {
                sendWelcomeMessage(sender);
            }
            else if (text.indexOf("MORE_H") > -1) {
                console.log("text", text);
                var arr = text.split("_");
                var tagID = arr[2];
                var currentPage = arr[3];
                var totalPage = arr[4];
                SendMoreHumans(sender, tagID, currentPage, totalPage);
            }
            else if (text.indexOf("MORE_S") > -1) {
                console.log("text", text);
                var arr = text.split("_");
                var humanID = arr[2];
                var currentPage = arr[3];
                var totalPage = arr[4];
                SendMoreSocialMediaByHumanID(sender, humanID, currentPage, totalPage);
            }
            else {
                SendSocialMediaByHumanID(sender, text);
            }
        }
        else if (event.message.quick_reply) {
            text = event.message.quick_reply.payload;

            if (text.indexOf("MORE_H") > -1) {
                console.log("text", text);
                var arr = text.split("_");
                var tagID = arr[2];
                var currentPage = arr[3];
                var totalPage = arr[4];
                SendMoreHumans(sender, tagID, currentPage, totalPage);
            }
            if (text.indexOf("MORE_S") > -1) {
                console.log("text", text);
                var arr = text.split("_");
                var humanID = arr[2];
                var currentPage = arr[3];
                var totalPage = arr[4];
                SendMoreSocialMediaByHumanID(sender, humanID, currentPage, totalPage);
            }
            else {
                SendHumans(sender, text);
            }
        }
        else if (event.message && event.message.text) {
            text = event.message.text;
            var welcomeTextMessages = ['selam', 'slm', 'merhaba', 'mrb', 'hi', 'hello', 'sa', 'basla'];

            if (welcomeTextMessages.indexOf(text.toLowerCase())> -1) {
                sendWelcomeMessage(sender);
            }
            else {
                try {
                    if (text.length >= 3) {
                        SendSearchHuman(sender, text);
                    }
                    else {
                        sendTextMessage(sender, "Dediğini anlayamadım.\nEn az üç harfli kahraman adını girebilirsin veya baştan başlamak istersen 'selam' yazabilirsin.");
                    }
                } catch (ex) {
                    console.log("Hata oluştu: " + ex);
                }
            }
        }
    }
    res.sendStatus(200);
});


function SendHumans(sender, tagID) {
    sendTypingOn(sender);

    humansGraphQLSDK.getHumansByTagID_TotalCount(tagID, function (humans_totalCount) {
        var totalPage = Math.round(humans_totalCount / 10);

        var page = 0;
        humansGraphQLSDK.getHumansByTagID(tagID, page * 10, function (humans) {
            var result = [];

            humans.forEach(function (element) {
                //console.log(element.name);

                result.push({
                    title: element.name,
                    image_url: "http://dnomak.com/img/avatar/" + element.username + ".jpg",
                    subtitle: element.title,
                    buttons: [
                        {
                            type: "web_url",
                            url: "https://www.youtube.com/watch?v=" + element.videoId,
                            title: "Röportajı İzle"
                        },
                        {
                            type: "postback",
                            title: "Hesapları Gör",
                            payload: element.id
                        },
                        {
                            type: "element_share"
                        }
                    ]
                });

                if (result.length == humans.length) {
                    page++;
                    sendGenericMessage(sender, tagID, page, totalPage, result);
                }

            }, this);



        });
    });
    sendTypingOff(sender);
}


function SendMoreHumans(sender, tagID, page, totalPage) {
    console.log("SendMoreHumans", tagID, page, totalPage);
    sendTypingOn(sender);

    humansGraphQLSDK.getHumansByTagID(tagID, page * 10, function (humans) {
        var result = [];

        humans.forEach(function (element) {
            //console.log(element.name);

            result.push({
                title: element.name,
                image_url: "http://dnomak.com/img/avatar/" + element.username + ".jpg",
                subtitle: element.title,
                buttons: [
                    {
                        type: "web_url",
                        url: "https://www.youtube.com/watch?v=" + element.videoId,
                        title: "Röportajı İzle"
                    },
                    {
                        type: "postback",
                        title: "Hesapları Gör",
                        payload: element.id
                    },
                    {
                        type: "element_share"
                    }
                ]
            });

            if (result.length == humans.length) {
                page++;
                sendGenericMessage(sender, tagID, page, totalPage, result);
            }


        }, this);
    });
    //sendTypingOff(sender);
}

function SendSearchHuman(sender, humanSearchName) {
    sendTypingOn(sender);

    humansGraphQLSDK.getHumansByName(humanSearchName, function (humans) {
        console.log("humans.length", humans.length);
        var result = [];
        if (humans.length > 0) {
            humans.forEach(function (element, index) {
                //console.log(element.name);

                result.push({
                    title: element.name,
                    image_url: "http://dnomak.com/img/avatar/" + element.username + ".jpg",
                    subtitle: element.title,
                    buttons: [
                        {
                            type: "web_url",
                            url: "https://www.youtube.com/watch?v=" + element.videoId,
                            title: "Röportajı İzle"
                        },
                        {
                            type: "postback",
                            title: "Hesapları Gör",
                            payload: element.id
                        },
                        {
                            type: "element_share"
                        }
                    ]
                });


                if (result.length == humans.length) {
                    sendGenericMessageGeneral(sender, result);
                }

            }, this);


        }
        else {
            sendTextMessage(sender, "Aradığın kişiyi bulamadım ama çok yakın zamanda bir sohbet yapmaya çalışırım :(\nŞimdilik en az üç karakter girerek yeniden arayabilir veya baştan başlamak istersen 'selam' yazabilirsin.");
        }


    });
    //sendTypingOff(sender);
}


function SendSocialMediaByHumanID(sender, humanID) {
    sendTypingOn(sender);


    humansGraphQLSDK.getAccountsByHumanID_TotalCount(humanID, function (website_totalCount) {
        var totalPage = Math.round(website_totalCount / 3);
        console.log("SOCIAL_totalPage", totalPage);
        var page = 0;
        humansGraphQLSDK.getAccountsByHumanID(humanID, page * 3, function (human) {
            var result = [];

            result.push({
                title: human.name,
                image_url: "http://dnomak.com/img/avatar/" + human.username + ".jpg",
                subtitle: "Sosyal Medya Hesapları"
            });

            human.accounts.forEach(function (element) {
                //console.log(element.name);

                var socialLogo = "";
                var socialLogoBasePath = "http://yavuzz.com/humans-chatbot/";
                switch (element.website.name.toLowerCase()) {
                    case 'twitter':
                        socialLogo = "twitter.png";
                        break;
                    case 'codepen':
                        socialLogo = "codepen.png";
                        break;
                    case 'github':
                        socialLogo = "github.png";
                        break;
                    case 'gitlab':
                        socialLogo = "gitlab.png";
                        break;
                    case 'dribbble':
                        socialLogo = "dribbble.png";
                        break;
                    case 'instagram':
                        socialLogo = "instagram.png";
                        break;
                    case 'patreon':
                        socialLogo = "patreon.png";
                        break;
                    case 'youtube':
                        socialLogo = "youtube.png";
                        break;
                    case 'behance':
                        socialLogo = "behance.png";
                        break;
                    case 'çalışma masam':
                        socialLogo = "calisma_masam.png";
                        break;
                }

                result.push({
                    title: element.website.name,
                    image_url: socialLogoBasePath + socialLogo,
                    subtitle: element.website.url + element.username,
                    buttons: [
                        {
                            type: "web_url",
                            url: element.website.url + element.username,
                            title: "HESABA GİT"
                        }
                    ]
                });


                if (result.length == human.accounts.length + 1) {
                    page++;
                    sendListMessage(sender, humanID, page, totalPage, result);
                }
            }, this);
        });
        sendTypingOff(sender);

    });
}

function SendMoreSocialMediaByHumanID(sender, humanID, page, totalPage) {
    sendTypingOn(sender);

    humansGraphQLSDK.getAccountsByHumanID(humanID, page * 3, function (human) {
        var result = [];

        result.push({
            title: human.name,
            image_url: "http://dnomak.com/img/avatar/" + human.username + ".jpg",
            subtitle: "Sosyal Medya Hesapları"
        });

        human.accounts.forEach(function (element) {
            //console.log(element.name);

            var socialLogo = "";
            var socialLogoBasePath = "http://yavuzz.com/humans-chatbot/";
            switch (element.website.name.toLowerCase()) {
                case 'twitter':
                    socialLogo = "twitter.png";
                    break;
                case 'codepen':
                    socialLogo = "codepen.png";
                    break;
                case 'github':
                    socialLogo = "github.png";
                    break;
                case 'gitlab':
                    socialLogo = "gitlab.png";
                    break;
                case 'dribbble':
                    socialLogo = "dribbble.png";
                    break;
                case 'instagram':
                    socialLogo = "instagram.png";
                    break;
                case 'patreon':
                    socialLogo = "patreon.png";
                    break;
                case 'youtube':
                    socialLogo = "youtube.png";
                    break;
                case 'behance':
                    socialLogo = "behance.png";
                    break;
                case 'çalışma masam':
                    socialLogo = "calisma_masam.png";
                    break;
            }

            result.push({
                title: element.website.name,
                image_url: socialLogoBasePath + socialLogo,
                subtitle: element.website.url + element.username,
                buttons: [
                    {
                        type: "web_url",
                        url: element.website.url + element.username,
                        title: "HESABA GİT"
                    }
                ]
            });


            if (result.length  == human.accounts.length + 1) {
                page++;
                sendListMessage(sender, humanID, page, totalPage, result);
            }

        }, this);



        //sendTypingOff(sender);
    });
}


function sendTextMessage(sender, text) {
    messageData = {
        text: text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}


function sendGenericMessageGeneral(sender, nodes) {
    messageData = {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: nodes
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        else {
            sendTagsMessage(sender);
        }
    });
}

function sendGenericMessage(sender, tagID, page, totalPage, nodes) {
    console.log("tagID",tagID);
    //console.log("nodes", nodes);
    messageData = {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: nodes
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        else {
            if (page < totalPage) {
                sendMoreMessage(sender, tagID, page, totalPage);
            }
            else {
                sendTagsMessage(sender);
            }

        }
    });
}

function sendListMessage(sender, nodes) {
    messageData = {
        attachment: {
            type: "template",
            payload: {
                template_type: "list",
                elements: nodes
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

function sendListMessage(sender, humanID, page, totalPage, nodes) {
    console.log("humanID",humanID);
    messageData = {
        attachment: {
            type: "template",
            payload: {
                template_type: "list",
                elements: nodes
            }
        }
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
        else {
            if (page < totalPage) {
                sendMoreListMessage(sender, humanID, page, totalPage);
            }
            else {
                sendTagsMessage(sender);
            }

        }
    });
}

function sendMoreMessage(sender, tagID, page, totalPage) {
    console.log("tagID",tagID);
    messageData = {
        text: "Diğer kahramanları görmek istermisin?",
        quick_replies: [
            {
                content_type: "text",
                title: "Daha Fazla",
                payload: "MORE_H_" + tagID + "_" + page + "_" + totalPage
            }
        ]
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });

}

function sendMoreListMessage(sender, humanID, page, totalPage) {
    console.log("humanID",humanID);
    messageData = {
        text: "Diğer sosyal medya hesaplarını görmek ister misin?",
        quick_replies: [
            {
                content_type: "text",
                title: "Daha Fazla",
                payload: "MORE_S_" + humanID + "_" + page + "_" + totalPage
            }
        ]
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });

}

function sendTagsMessage(sender) {

    //Röportaj kategorilerini getir
    humansGraphQLSDK.getAllTags(function (humans_allTags) {
        console.log(humans_allTags);

        var allTags = [];
        humans_allTags.forEach(function (element) {
            allTags.push({
                content_type: "text",
                title: element.name,
                payload: element.id
            });
        }, this);


        messageData = {
            text: "Başka kiminle sohbet etmek istersin?",
            quick_replies: allTags
        }
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: app.get('page_access_token') },
            method: 'POST',
            json: {
                recipient: { id: sender },
                message: messageData,
            }
        }, function (error, response, body) {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });

    });
}


function sendWelcomeMessage(sender) {

    //Röportaj kategorilerini getir
    humansGraphQLSDK.getAllTags(function (humans_allTags) {
        console.log(humans_allTags);

        var allTags = [];
        humans_allTags.forEach(function (element) {
            allTags.push({
                content_type: "text",
                title: element.name,
                payload: element.id
            });
        }, this);

        var userName = "";
        var userFirstName = "";
        request({
            url: 'https://graph.facebook.com/v2.6/' + sender,
            qs: { access_token: app.get('page_access_token'), fields: "first_name,last_name" },
            method: 'GET'
        }, function (error, response, body) {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
            else if (response.statusCode == 200) {
                var jsonObject = JSON.parse(body);
                userName = jsonObject.first_name + " " + jsonObject.last_name;
                userFirstName = jsonObject.first_name;

                messageData = {
                    text: "Merhaba " + userFirstName + ", kiminle sohbet etmek istersin?",
                    quick_replies: allTags
                    /*
                    quick_replies:[
                    {
                        content_type:"text",
                        title:"Developer",
                        payload:"P_Developer"
                    },
                    {
                        content_type:"text",
                        title:"Youtuber",
                        payload:"P_Youtuber"
                    }
                    ]*/
                }
                request({
                    url: 'https://graph.facebook.com/v2.6/me/messages',
                    qs: { access_token: app.get('page_access_token') },
                    method: 'POST',
                    json: {
                        recipient: { id: sender },
                        message: messageData,
                    }
                }, function (error, response, body) {
                    if (error) {
                        console.log('Error sending message: ', error);
                    } else if (response.body.error) {
                        console.log('Error: ', response.body.error);
                    }
                });
            }
            else {
                messageData = {
                    text: "Merhaba, kiminle sohbet etmek istersin?",
                    quick_replies: allTags
                    /*
                    quick_replies:[
                    {
                        content_type:"text",
                        title:"Developer",
                        payload:"P_Developer"
                    },
                    {
                        content_type:"text",
                        title:"Youtuber",
                        payload:"P_Youtuber"
                    }
                    ]*/
                }
                request({
                    url: 'https://graph.facebook.com/v2.6/me/messages',
                    qs: { access_token: app.get('page_access_token') },
                    method: 'POST',
                    json: {
                        recipient: { id: sender },
                        message: messageData,
                    }
                }, function (error, response, body) {
                    if (error) {
                        console.log('Error sending message: ', error);
                    } else if (response.body.error) {
                        console.log('Error: ', response.body.error);
                    }
                });
            }
        });
    });
}

function addHumantedButton() {
    request({
        url: 'https://graph.facebook.com/v2.6/me/thread_settings',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            get_humanted: {
                payload: "basla"
            }
        }

    }, function (error, response, body) {
        //console.log(response)
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error addHumantedButton: ', response.body.error)
        }
    })

}

function addSettingGreetingText() {
    request({
        url: 'https://graph.facebook.com/v2.6/me/thread_settings',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            setting_type: "greeting",
            greeting: {
                text: "Merhaba {{user_first_name}}. Geliştirici ve Tasarımcı arkadaşlarla birlikte bu işe olan aşkını ve motivasyonunu arttırmaya çalışıyorum."
            }
        }

    }, function (error, response, body) {
        //console.log(response)
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error addSettingGreetingText: ', response.body.error)
        }
    })

}

function addPersistentMenu() {
    request({
        url: 'https://graph.facebook.com/v2.6/me/thread_settings',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            setting_type: "call_to_actions",
            thread_state: "existing_thread",
            call_to_actions: [
                {
                    type: "postback",
                    title: "Baştan Başla",
                    payload: "basla"
                },
                {
                    type: "web_url",
                    title: "Web Site",
                    url: "http://www.dnomak.com/youtube",
                    webview_height_ratio: "full"
                },
                {
                    type: "web_url",
                    title: "Developed by Yavuz",
                    url: "http://blog.yavuzz.com/",
                    webview_height_ratio: "full"
                },
            ]
        }

    }, function (error, response, body) {
        //console.log(response)
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error addPersistentMenu: ', response.body.error)
        }
    })

}

function removePersistentMenu() {
    request({
        url: 'https://graph.facebook.com/v2.6/me/thread_settings',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            setting_type: "call_to_actions",
            thread_state: "existing_thread",
            call_to_actions: []
        }

    }, function (error, response, body) {
        //console.log(response)
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

function sendTypingOn(sender) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            recipient: { id: sender },
            sender_action: "typing_on"
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

function sendTypingOff(sender) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: app.get('page_access_token') },
        method: 'POST',
        json: {
            recipient: { id: sender },
            sender_action: "typing_off"
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

app.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
