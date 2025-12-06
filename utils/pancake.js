// utils/pancake.js
// Gom URL builder + fetch JSON Pancake

// Node >=18 có global fetch

function buildConvListURL({ pageId, token, count }) {
    const base = `https://pancake.vn/api/v1/pages/${pageId}/conversations`;
    const qs = new URLSearchParams({
        unread_first: 'true',
        mode: 'NONE',
        tags: '"ALL"',
        'except_tags[]': '',
        access_token: token,
        cursor_mode: 'true',
        from_platform: 'web',
    });
    if (count && Number(count) > 0) {
        qs.set('current_count', String(count));
    }
    return `${base}?${qs.toString()}`;
}

function buildMessagesURL({ pageId, conversationId, customerId, token, count = 0 }) {
    const cid = String(conversationId);
    let conversationPath;
    
    // ✅ Kiểm tra prefix để xử lý đúng format cho từng platform
    if (cid.startsWith('ttm_') || cid.startsWith('pzl_') || cid.startsWith('igo_')) {
        // TikTok, Zalo, Instagram Official: sử dụng conversation ID đầy đủ
        // Ví dụ: "pzl_12345_67890" → giữ nguyên "pzl_12345_67890"
        conversationPath = cid;
    } else if (cid.includes('_') && cid.split('_').length >= 2) {
        // Facebook: đã có format "pageId_customerId" → giữ nguyên
        // Ví dụ: "140918602777989_123456789" → giữ nguyên
        conversationPath = cid;
    } else {
        // Facebook: chỉ có customerId → ghép với pageId
        // Ví dụ: "123456789" → "140918602777989_123456789"
        conversationPath = `${pageId}_${cid}`;
    }
    
    const base = `https://pancake.vn/api/v1/pages/${pageId}/conversations/${conversationPath}/messages`;
    const qs = new URLSearchParams({
        access_token: token,
        is_new_api: 'true',
        user_view: 'true',
        separate_pos: 'true',
        customer_id: customerId || '',
    });
    if (Number(count) > 0) qs.set('current_count', String(count));
    return `${base}?${qs.toString()}`;
}

function buildSearchURL({ pageId, q, token }) {
    const base = `https://pancake.vn/api/v1/pages/${pageId}/conversations/search`;
    const qs = new URLSearchParams({
        q,
        access_token: token,
        cursor_mode: 'true',
    });
    return `${base}?${qs.toString()}`;
}

async function getJson(url) {
    const r = await fetch(url, { method: 'GET' });
    if (!r.ok) {
        const text = await r.text().catch(() => '');
        throw new Error(`Pancake ${r.status} ${text}`.trim());
    }
    return r.json();
}

export async function getConversations({ pageId, token, current_count }) {
    const url = buildConvListURL({ pageId, token, count: current_count });
    const data = await getJson(url);
    return Array.isArray(data?.conversations) ? data.conversations : [];
}

export async function getConversationsSearch({ pageId, token, q }) {
    const url = buildSearchURL({ pageId, token, q });
    const data = await getJson(url);
    return Array.isArray(data?.conversations) ? data.conversations : [];
}

export async function getMessages({ pageId, conversationId, customerId, token, count }) {
    const url = buildMessagesURL({ pageId, conversationId, customerId, token, count });
    // console.log('[pancake.js] getMessages URL:', url);
    // console.log('[pancake.js] getMessages params:', { pageId, conversationId, customerId, count });
    
    try {
        const data = await getJson(url);
        // console.log('[pancake.js] getMessages raw response type:', typeof data);
        // console.log('[pancake.js] getMessages response structure:', {
        //     isArray: Array.isArray(data),
        //     isObject: typeof data === 'object' && data !== null,
        //     hasMessages: Array.isArray(data?.messages),
        //     messagesCount: Array.isArray(data?.messages) ? data.messages.length : 0,
        //     itemsCount: Array.isArray(data) ? data.length : 0,
        //     rawDataKeys: Object.keys(data || {}),
        //     success: data?.success,
        //     hasConvFrom: !!data?.conv_from,
        //     hasPost: !!data?.post
        // });
        
        // Log sample của messages nếu có
        if (Array.isArray(data?.messages) && data.messages.length > 0) {
            // console.log('[pancake.js] Sample message (first):', {
            //     id: data.messages[0].id,
            //     type: data.messages[0].type,
            //     original_message: data.messages[0].original_message,
            //     from: data.messages[0].from,
            //     is_removed: data.messages[0].is_removed
            // });
        }
        
        // API có thể trả về array trực tiếp hoặc object có key 'messages'
        if (Array.isArray(data)) {
            // console.log('[pancake.js] ✅ Response is array, returning directly, count:', data.length);
            return data;
        }
        
        // Với COMMENT type, API trả về object có 'messages' array
        if (Array.isArray(data?.messages)) {
            // console.log('[pancake.js] ✅ Response has messages array, returning messages, count:', data.messages.length);
            return data.messages;
        }
        
        console.warn('[pancake.js] ⚠️ No messages found in response');
        console.warn('[pancake.js] Response data:', JSON.stringify(data, null, 2).substring(0, 500));
        return [];
    } catch (error) {
        console.error('[pancake.js] ❌ Error fetching messages:', error);
        throw error;
    }
}
