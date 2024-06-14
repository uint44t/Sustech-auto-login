// ==UserScript==
// @name         SUSTech auto login
// @namespace    https://blog.vollate.top/
// @version      1.0.1
// @description  请不要在任何公共设备上使用此脚本，对于您的账号安全造成的损失，作者概不负责。
// @author       Vollate
// @match        https://cas.sustech.edu.cn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sustech.edu.cn
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    function createSettingsDialog() {
        const container = document.createElement('div');
        container.id = 'cas-login-ui';
        container.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border: 1px solid #ccc; padding: 20px; z-index: 10000; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);">
                <label>Username: <input type="text" id="cas-username" value="${GM_getValue('username', '')}" style="margin-bottom: 10px;"></label><br>
                <label>Password: <input type="password" id="cas-password" value="${GM_getValue('password', '')}" style="margin-bottom: 10px;"></label><br>
                <button id="save-credentials" style="margin-right: 5px;">Save</button>
                <button id="clear-credentials" style="margin-right: 5px;">Clear</button>
                <button id="close-settings">Close</button>
            </div>
        `;
        document.body.appendChild(container);

        document.getElementById('save-credentials').addEventListener('click', () => {
            const username = document.getElementById('cas-username').value;
            const password = document.getElementById('cas-password').value;
            GM_setValue('username', username);
            GM_setValue('password', password);
            alert('Credentials saved!');
        });

        document.getElementById('clear-credentials').addEventListener('click', () => {
            GM_deleteValue('username');
            GM_deleteValue('password');
            document.getElementById('cas-username').value = '';
            document.getElementById('cas-password').value = '';
            alert('Credentials cleared!');
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            document.getElementById('cas-login-ui').remove();
        });
    }

    GM_registerMenuCommand('CAS Login Settings', createSettingsDialog);

    const username = GM_getValue('username', '');
    const password = GM_getValue('password', '');

    if (!username || !password) {
        console.log('Please enter your credentials using the menu option.');
        return;
    }

    function storeCookies(responseHeaders) {
        const headersArray = responseHeaders.split('\n');
        const setCookieHeaders = headersArray.filter(header => header.toLowerCase().startsWith('set-cookie:'));
        if (setCookieHeaders.length) {
            setCookieHeaders.forEach(header => {
                const cookie = header.substring(12).split(';')[0].trim();
                if (cookie && !cookie.endsWith('=""') && !cookie.endsWith('=')) {
                    console.log('Set cookie:', cookie);
                    document.cookie = cookie;
                }
            });
        }
    }

    GM_xmlhttpRequest({
        method: 'GET',
        url: 'https://cas.sustech.edu.cn/cas/login',
        onload: function (response) {
            storeCookies(response.responseHeaders);

            const text = response.responseText;
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const inputElement = doc.querySelector('input[type="hidden"][name="execution"]');
            if (inputElement) {
                const execution = inputElement.getAttribute('value');
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: 'https://cas.sustech.edu.cn/cas/login',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: `username=${username}&password=${password}&execution=${execution}&_eventId=submit&geolocation=`,
                    onload: function (response) {
                        storeCookies(response.responseHeaders);
                        location.reload();
                    },
                    onerror: function (error) {
                        console.error('Login request failed', error);
                    }
                });
            } else {
                console.log({success: false});
            }
        },
        onerror: function (error) {
            console.error('Initial GET request failed', error);
        }
    });
})();