// ==UserScript==
// @name         SUSTech auto login
// @namespace    https://blog.vollate.top/
// @version      1.1.3
// @description  请不要在任何公共设备上使用此脚本，对于您的账号安全造成的损失，作者概不负责。
// @author       Vollate
// @match        https://cas.sustech.edu.cn/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=sustech.edu.cn
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
    'use strict';

    function autoLoginLog(msg) {
        console.log(`[SUSTech Auto Login]: ${msg}`);
    }

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
        autoLoginLog('Please enter your credentials using the menu option.');
        return;
    } else if (document.documentURI.split('?service').length === 1) {
        autoLoginLog('Avoid non-redirect auto login');
        return;
    }

    function storeCookies(responseHeaders) {
        const headersArray = responseHeaders.split('\n');
        headersArray.forEach(header => {
            if (header.toLowerCase().startsWith('set-cookie:')) {
                const cookie = header.substring(12).split(';')[0].trim();
                if (cookie && !cookie.endsWith('=""') && !cookie.endsWith('=')) {
                    document.cookie = cookie;
                }
            }
        });
    }

    const inputElement = document.querySelector('input[type="hidden"][name="execution"]');
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
                console.error('[SUSTech Auto Login]: Login request failed', error);
            }
        });
    } else {
        autoLoginLog('Execution element not found');
    }
})();
