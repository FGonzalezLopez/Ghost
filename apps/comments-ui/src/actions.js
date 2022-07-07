async function loadMoreComments({state, api}) {
    let page = 1;
    if (state.pagination && state.pagination.page) {
        page = state.pagination.page + 1;
    }
    const data = await api.comments.browse({page, postId: state.postId});
    
    // Note: we store the comments from new to old, and show them in reverse order
    return {
        comments: [...state.comments, ...data.comments],
        pagination: data.meta.pagination
    };
}

async function addComment({state, api, data: comment}) {
    const data = await api.comments.add({comment});
    comment = data.comments[0];

    const commentStructured = {
        ...comment,
        // Temporary workaround for missing member relation (bug in API)
        member: state.member
    };
    
    return {
        comments: [commentStructured, ...state.comments]
        // todo: fix pagination now?
    };
}

async function hideComment({state, adminApi, data: comment}) {
    await adminApi.hideComment(comment.id);

    return {
        comments: state.comments.map((c) => {
            if (c.id === comment.id) {
                return {
                    ...c,
                    status: 'hidden'
                };
            }
            return c;
        })
    };
}

async function showComment({state, adminApi, data: comment}) {
    await adminApi.showComment(comment.id);

    return {
        comments: state.comments.map((c) => {
            if (c.id === comment.id) {
                return {
                    ...c,
                    status: 'published'
                };
            }
            return c;
        })
    };
}

async function likeComment({state, api, data: comment}) {
    await api.comments.like({comment});

    return {
        comments: state.comments.map((c) => {
            if (c.id === comment.id) {
                return {
                    ...c,
                    liked: true,
                    likes_count: c.likes_count + 1
                };
            }
            return c;
        })
    };
}

async function unlikeComment({state, api, data: comment}) {
    await api.comments.unlike({comment});

    return {
        comments: state.comments.map((c) => {
            if (c.id === comment.id) {
                return {
                    ...c,
                    liked: false,
                    likes_count: c.likes_count - 1
                };
            }
            return c;
        })
    };
}

async function deleteComment({state, api, data: comment}) {
    await api.comments.edit({
        comment: {
            id: comment.id,
            status: 'deleted'
        }
    });

    return {
        comments: state.comments.map((c) => {
            if (c.id === comment.id) {
                return {
                    ...c,
                    status: 'deleted'
                };
            }
            return c;
        })
    };
}

async function editComment({state, api, data: comment}) {
    const data = await api.comments.edit({
        comment
    });
    comment = data.comments[0];

    // Replace the comment in the state with the new one
    return {
        comments: state.comments.map((c) => {
            if (c.id === comment.id) {
                return comment;
            }
            return c;
        })
    };
}

const Actions = {
    // Put your actions here
    addComment,
    editComment,
    hideComment,
    deleteComment,
    showComment,
    likeComment,
    unlikeComment,
    loadMoreComments
};

/** Handle actions in the App, returns updated state */
export default async function ActionHandler({action, data, state, api, adminApi}) {
    const handler = Actions[action];
    if (handler) {
        return await handler({data, state, api, adminApi}) || {};
    }
    return {};
}
