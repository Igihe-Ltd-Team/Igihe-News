<?php
/**
 * Plugin Name: IGIHE Frontend Revalidation
 * Description: Notifies the Next.js frontend whenever WordPress content changes.
 */

if (!defined('ABSPATH')) {
    exit;
}

function igihe_frontend_revalidate(array $payload): void
{
    if (!defined('IGIHE_FRONTEND_REVALIDATE_URL') || !defined('IGIHE_FRONTEND_REVALIDATE_SECRET')) {
        return;
    }

    wp_remote_post(IGIHE_FRONTEND_REVALIDATE_URL, [
        'blocking' => false,
        'timeout' => 3,
        'headers' => [
            'Content-Type' => 'application/json',
            'x-revalidate-secret' => IGIHE_FRONTEND_REVALIDATE_SECRET,
        ],
        'body' => wp_json_encode($payload),
    ]);
}

function igihe_frontend_post_payload(WP_Post $post, string $action): array
{
    $categories = wp_get_post_terms($post->ID, 'category', ['fields' => 'slugs']);

    return [
        'id' => $post->ID,
        'slug' => $post->post_name,
        'type' => $post->post_type,
        'category' => $categories[0] ?? null,
        'categories' => $categories,
        'status' => $post->post_status,
        'action' => $action,
    ];
}

add_action('save_post', function (int $post_id, WP_Post $post, bool $update): void {
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return;
    }

    igihe_frontend_revalidate(igihe_frontend_post_payload($post, $update ? 'update' : 'create'));
}, 10, 3);

add_action('trashed_post', function (int $post_id): void {
    $post = get_post($post_id);
    if ($post instanceof WP_Post) {
        igihe_frontend_revalidate(igihe_frontend_post_payload($post, 'trash'));
    }
});

add_action('before_delete_post', function (int $post_id, WP_Post $post): void {
    igihe_frontend_revalidate(igihe_frontend_post_payload($post, 'delete'));
}, 10, 2);

function igihe_frontend_taxonomy_change(int $term_id, int $tt_id, string $taxonomy): void
{
    if (!in_array($taxonomy, ['category', 'post_tag'], true)) {
        return;
    }

    $term = get_term($term_id, $taxonomy);
    if (!is_wp_error($term)) {
        igihe_frontend_revalidate([
            'type' => $taxonomy === 'post_tag' ? 'tag' : 'category',
            'slug' => $term->slug,
            'category' => $taxonomy === 'category' ? $term->slug : null,
            'action' => 'taxonomy-change',
        ]);
    }
}

add_action('created_term', 'igihe_frontend_taxonomy_change', 10, 3);
add_action('edited_term', 'igihe_frontend_taxonomy_change', 10, 3);
add_action('delete_term', 'igihe_frontend_taxonomy_change', 10, 3);
