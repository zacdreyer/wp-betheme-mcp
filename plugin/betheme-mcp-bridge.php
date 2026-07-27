<?php
/**
 * Plugin Name: BeTheme MCP Bridge
 * Description: Secure bridge endpoints for an MCP server to manage WordPress and BeTheme content.
 * Version: 28.5.4-alpha.003
 * Author: BeTheme MCP Project
 */

if (!defined('ABSPATH')) {
    exit;
}

class BeTheme_Mcp_Bridge {
    private const ALLOWED_PAGE_META = [
        'mfn-post-layout',
        'mfn-post-sidebar',
        'mfn-post-sidebar2',
        'mfn-post-hide-content',
        'mfn-post-hide-title',
        'mfn-post-hide-image',
        'mfn-post-full-width',
        'mfn-post-remove-padding',
        'mfn-post-one-page',
        'mfn-post-custom-layout',
        'mfn-post-menu',
        'mfn-post-css',
        'mfn-post-js',
        'mfn-meta-seo-title',
        'mfn-meta-seo-description',
        'mfn-meta-seo-keywords',
        'mfn-meta-seo-og-image',
        'mfn_header_template',
        'mfn_footer_template',
        'mfn_popup_included',
        '_thumbnail_id',
        'mfn-post-slider',
        'mfn-post-slider-layer',
        'mfn-post-slider-shortcode',
        'mfn-post-subheader-image',
    ];

    private const ALLOWED_TEMPLATE_META = [
        'mfn_template_type',
        'mfn_template_conditions',
        'mfn_publication_options',
        'mfn_template_perpage',
        'header_position',
        'body_offset_header',
        'header_width',
        'header_content_on_submenu',
        'header_content_on_submenu_color',
        'header_content_on_submenu_blur',
        'header_sticky',
        'header_sticky_width',
        'header_mobile',
        'mobile_header_position',
        'mobile_body_offset_header',
        'footer_type',
        'popup_position',
        'popup_display',
        'popup_display_delay',
        'popup_display_referer',
        'popup_display_scroll',
        'popup_display_scroll_element',
        'popup_display_visibility',
        'popup_display_visibility_cookie_days',
        'popup_entrance_animation',
        'popup_hide',
        'popup_hide_delay',
        'popup_offset',
        'popup_overlay_blur',
        'popup_width',
        'popup_body_scroll',
        'popup_close_button_active',
        'popup_close_button_align',
        'popup_close_button_display',
        'popup_close_button_display_delay',
        'popup_close_on_overlay_click',
    ];

    private const ALLOWED_TEMPLATE_TYPES = [
        'default', 'section', 'wrap', 'shop-archive', 'archive-product', 'single-product',
        'cart', 'checkout', 'thanks', 'popup', 'header', 'megamenu', 'sidemenu',
        'single-post', 'blog', 'archive-post', 'portfolio', 'archive-portfolio',
        'single-portfolio', 'footer', 'search', 'custom',
    ];

    private const MAX_BUILDER_PAYLOAD_BYTES = 1048576;
    private const RATE_LIMIT_REQUESTS = 120;
    private const RATE_LIMIT_WINDOW = 60;

    public static function bootstrap() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
    }

    public static function register_routes() {
        register_rest_route('betheme-mcp/v1', '/health', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'health'],
            'permission_callback' => [__CLASS__, 'auth_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/auth', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'auth_exchange'],
            'permission_callback' => [__CLASS__, 'auth_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/site', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'site_context'],
            'permission_callback' => [__CLASS__, 'auth_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/capabilities', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'capabilities'],
            'permission_callback' => [__CLASS__, 'auth_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/pages', [
            'methods' => ['GET', 'POST'],
            'callback' => [__CLASS__, 'handle_pages'],
            'permission_callback' => [__CLASS__, 'page_permission_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/pages/(?P<id>\d+)', [
            'methods' => ['GET', 'PUT', 'DELETE'],
            'callback' => [__CLASS__, 'handle_page_detail'],
            'permission_callback' => [__CLASS__, 'page_permission_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/pages/(?P<id>\d+)/publish', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'handle_page_publish'],
            'permission_callback' => [__CLASS__, 'page_permission_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/pages/(?P<id>\d+)/builder', [
            'methods' => ['GET', 'POST'],
            'callback' => [__CLASS__, 'handle_page_builder'],
            'permission_callback' => [__CLASS__, 'page_permission_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/templates', [
            'methods' => ['GET', 'POST'],
            'callback' => [__CLASS__, 'handle_templates'],
            'permission_callback' => [__CLASS__, 'template_permission_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/templates/(?P<id>\d+)', [
            'methods' => ['GET', 'PUT'],
            'callback' => [__CLASS__, 'handle_template_detail'],
            'permission_callback' => [__CLASS__, 'template_permission_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/plugins', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'handle_plugins'],
            'permission_callback' => [__CLASS__, 'plugin_permission_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/plugins/install', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'handle_plugin_install'],
            'permission_callback' => [__CLASS__, 'plugin_install_permission_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/plugins/activate', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'handle_plugin_activate'],
            'permission_callback' => [__CLASS__, 'plugin_permission_check'],
        ]);

        register_rest_route('betheme-mcp/v1', '/plugins/deactivate', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'handle_plugin_deactivate'],
            'permission_callback' => [__CLASS__, 'plugin_permission_check'],
        ]);
    }

    private static function get_expected_api_key() {
        return defined('BETHEME_MCP_API_KEY') ? BETHEME_MCP_API_KEY : '';
    }

    private static function check_rate_limit($apiKey) {
        if (empty($apiKey)) {
            return true;
        }

        $transientKey = 'betheme_mcp_rl_' . md5($apiKey);
        $requests = get_transient($transientKey);

        if ($requests === false) {
            set_transient($transientKey, 1, self::RATE_LIMIT_WINDOW);
            return true;
        }

        if ((int) $requests >= self::RATE_LIMIT_REQUESTS) {
            return new WP_Error('rest_rate_limited', 'Rate limit exceeded. Slow down.', ['status' => 429]);
        }

        set_transient($transientKey, (int) $requests + 1, self::RATE_LIMIT_WINDOW);
        return true;
    }

    public static function auth_check($request) {
        $apiKey = $request->get_header('x-api-key');
        $expected = self::get_expected_api_key();

        if (!$expected || !hash_equals($expected, (string) $apiKey)) {
            return new WP_Error('rest_forbidden', 'Authentication required', ['status' => 401]);
        }

        $rateLimit = self::check_rate_limit($apiKey);
        if (is_wp_error($rateLimit)) {
            return $rateLimit;
        }

        $timestamp = $request->get_header('x-request-timestamp');
        $signature = $request->get_header('x-request-signature');

        if (!$timestamp || !$signature || !ctype_digit($timestamp)) {
            return new WP_Error('rest_forbidden', 'Request signature required', ['status' => 401]);
        }

        $now = time();
        $ts = (int) $timestamp;
        if ($ts < ($now - 300) || $ts > ($now + 60)) {
            return new WP_Error('rest_forbidden', 'Request timestamp outside acceptable window', ['status' => 401]);
        }

        $method = $request->get_method();
        $body = $request->get_json_params() ?: [];
        $payload = empty($body) ? '' : wp_json_encode($body);
        $message = strtoupper($method) . '|' . $timestamp . '|' . $payload;
        $expectedSignature = hash_hmac('sha256', $message, $expected);

        if (!hash_equals($expectedSignature, (string) $signature)) {
            return new WP_Error('rest_forbidden', 'Invalid request signature', ['status' => 401]);
        }

        return true;
    }

    public static function page_permission_check($request) {
        $auth = self::auth_check($request);
        if (is_wp_error($auth)) {
            return $auth;
        }

        $method = $request->get_method();
        $capabilityMap = [
            'GET' => 'edit_pages',
            'POST' => 'publish_pages',
            'PUT' => 'edit_pages',
            'DELETE' => 'delete_pages',
        ];
        $capability = $capabilityMap[$method] ?? 'edit_pages';
        $postId = (int) $request->get_param('id');

        if ($postId && $method !== 'POST') {
            $post = get_post($postId);
            if ($post && (int) $post->post_author !== get_current_user_id()) {
                $othersMap = [
                    'GET' => 'edit_others_pages',
                    'PUT' => 'edit_others_pages',
                    'DELETE' => 'delete_others_pages',
                ];
                $capability = $othersMap[$method] ?? 'edit_others_pages';
            }
        }

        if (!current_user_can($capability)) {
            return new WP_Error('rest_forbidden', 'Insufficient capability for page operation', ['status' => 403]);
        }

        return true;
    }

    public static function template_permission_check($request) {
        $auth = self::auth_check($request);
        if (is_wp_error($auth)) {
            return $auth;
        }

        if (!current_user_can('edit_theme_options')) {
            return new WP_Error('rest_forbidden', 'Insufficient capability for template operation', ['status' => 403]);
        }

        return true;
    }

    public static function plugin_permission_check($request) {
        $auth = self::auth_check($request);
        if (is_wp_error($auth)) {
            return $auth;
        }

        if (!current_user_can('activate_plugins')) {
            return new WP_Error('rest_forbidden', 'Insufficient capability for plugin operation', ['status' => 403]);
        }

        return true;
    }

    public static function plugin_install_permission_check($request) {
        $auth = self::auth_check($request);
        if (is_wp_error($auth)) {
            return $auth;
        }

        if (!current_user_can('install_plugins')) {
            return new WP_Error('rest_forbidden', 'Insufficient capability for plugin installation', ['status' => 403]);
        }

        return true;
    }

    private static function audit($action, $target = '', $result = '', $details = []) {
        $entry = [
            'timestamp' => gmdate('c'),
            'actor' => get_current_user_id(),
            'action' => $action,
            'target' => $target,
            'result' => $result,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        ];

        if (!empty($details)) {
            $entry['details'] = $details;
        }

        do_action('betheme_mcp_audit', $entry);

        if (defined('BETHEME_MCP_AUDIT_LOG') && BETHEME_MCP_AUDIT_LOG) {
            error_log('[BeTheme MCP] ' . wp_json_encode($entry));
        }
    }

    private static function sanitize_post_status($status) {
        $allowed = ['publish', 'draft', 'pending', 'private', 'future'];
        return in_array($status, $allowed, true) ? $status : 'draft';
    }

    private static function sanitize_meta_value($value, $key = '') {
        if (is_array($value)) {
            return array_map(function ($item) use ($key) {
                return self::sanitize_meta_value($item, $key);
            }, $value);
        }
        if (!is_string($value)) {
            return $value;
        }

        $textareaKeys = ['mfn-post-css', 'mfn-post-js', 'mfn-meta-seo-description'];
        if (in_array($key, $textareaKeys, true)) {
            return sanitize_textarea_field($value);
        }

        return sanitize_text_field($value);
    }

    private static function validate_meta_keys(array $meta, array $allowedKeys) {
        $sanitized = [];
        foreach ($meta as $key => $value) {
            if (!in_array($key, $allowedKeys, true)) {
                continue;
            }
            $sanitized[sanitize_key($key)] = self::sanitize_meta_value($value, $key);
        }
        return $sanitized;
    }

    private static function store_builder_payload($postId, $payload) {
        if (!is_array($payload)) {
            return;
        }

        $encoded = wp_json_encode($payload);
        if (strlen($encoded) > self::MAX_BUILDER_PAYLOAD_BYTES) {
            return new WP_Error('payload_too_large', 'Builder payload exceeds maximum allowed size', ['status' => 413]);
        }

        $storageMode = function_exists('mfn_opts_get') ? mfn_opts_get('builder-storage') : '';

        if ($storageMode === 'encode') {
            update_post_meta($postId, 'mfn-page-items', base64_encode(serialize($payload)));
        } else {
            update_post_meta($postId, 'mfn-page-items', wp_slash($payload));
        }

        update_post_meta($postId, 'mfn-page-object', $payload);
        return true;
    }

    private static function read_builder_payload($postId) {
        $raw = get_post_meta($postId, 'mfn-page-items', true);
        if (empty($raw)) {
            return [];
        }

        if (is_array($raw)) {
            return $raw;
        }

        if (is_string($raw)) {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $decoded;
            }

            $unserialized = @unserialize(base64_decode($raw, true));
            if (is_array($unserialized)) {
                return $unserialized;
            }
        }

        return [];
    }

    private static function escape_response(array $data) {
        return array_map(function ($value) {
            if (is_string($value)) {
                return esc_html($value);
            }
            if (is_array($value)) {
                return self::escape_response($value);
            }
            return $value;
        }, $data);
    }

    public static function health($request) {
        return ['ok' => true, 'site' => esc_html(get_bloginfo('name'))];
    }

    public static function auth_exchange($request) {
        $theme = wp_get_theme();
        self::audit('authenticate', get_current_user_id(), 'success');

        return [
            'authenticated' => true,
            'site' => esc_html(get_bloginfo('name')),
            'url' => esc_url(home_url('/')),
            'theme' => esc_html($theme->get('Name')),
            'themeVersion' => esc_html($theme->get('Version')),
            'capabilities' => [
                'pages',
                'templates',
                'plugins',
                'builder_metadata',
            ],
        ];
    }

    public static function site_context($request) {
        $theme = wp_get_theme();
        return self::escape_response([
            'site' => get_bloginfo('name'),
            'url' => home_url('/'),
            'theme' => $theme->get('Name'),
            'themeVersion' => $theme->get('Version'),
        ]);
    }

    public static function capabilities($request) {
        return [
            'version' => '28.5.4-alpha.001',
            'authenticated' => true,
            'capabilities' => [
                'pages',
                'templates',
                'plugins',
                'builder_metadata',
            ],
        ];
    }

    public static function handle_pages($request) {
        if ($request->get_method() === 'POST') {
            $body = $request->get_json_params();
            $title = isset($body['title']) ? sanitize_text_field($body['title']) : 'Untitled page';
            $slug = isset($body['slug']) ? sanitize_title($body['slug']) : '';
            $content = isset($body['content']) ? wp_kses_post($body['content']) : '';

            $postId = wp_insert_post([
                'post_title' => $title,
                'post_name' => $slug,
                'post_type' => 'page',
                'post_status' => 'draft',
                'post_content' => $content,
            ], true);

            if (is_wp_error($postId)) {
                self::audit('create_page', '', 'failure');
                return new WP_Error('create_failed', $postId->get_error_message(), ['status' => 500]);
            }

            if (!empty($body['builder_payload']) && is_array($body['builder_payload'])) {
                $stored = self::store_builder_payload($postId, $body['builder_payload']);
                if (is_wp_error($stored)) {
                    return $stored;
                }
            }

            if (!empty($body['meta']) && is_array($body['meta'])) {
                $meta = self::validate_meta_keys($body['meta'], self::ALLOWED_PAGE_META);
                foreach ($meta as $metaKey => $metaValue) {
                    update_post_meta($postId, $metaKey, $metaValue);
                }
            }

            self::audit('create_page', $postId, 'success');
            return ['id' => $postId, 'status' => 'draft'];
        }

        $status = $request->get_param('status');
        $args = ['post_type' => 'page', 'posts_per_page' => 20, 'post_status' => 'any'];
        if ($status && in_array($status, ['publish', 'draft', 'pending', 'private', 'future'], true)) {
            $args['post_status'] = $status;
        }

        $pages = get_posts($args);
        return array_map(function ($page) {
            return [
                'id' => $page->ID,
                'title' => esc_html($page->post_title),
                'status' => $page->post_status,
            ];
        }, $pages);
    }

    public static function handle_page_detail($request) {
        $pageId = (int) $request->get_param('id');
        $page = get_post($pageId);

        if (!$page || $page->post_type !== 'page') {
            return new WP_Error('not_found', 'Page not found', ['status' => 404]);
        }

        if ($request->get_method() === 'DELETE') {
            $deleted = wp_delete_post($pageId, true);
            if (!$deleted) {
                self::audit('delete_page', $pageId, 'failure');
                return new WP_Error('delete_failed', 'Page could not be deleted', ['status' => 500]);
            }
            self::audit('delete_page', $pageId, 'success');
            return ['id' => $pageId, 'deleted' => true];
        }

        if ($request->get_method() === 'PUT') {
            $body = $request->get_json_params();
            $args = ['ID' => $pageId];

            if (!empty($body['title'])) {
                $args['post_title'] = sanitize_text_field($body['title']);
            }

            if (array_key_exists('content', $body)) {
                $args['post_content'] = wp_kses_post($body['content']);
            }

            if (array_key_exists('status', $body)) {
                $args['post_status'] = self::sanitize_post_status($body['status']);
            }

            $result = wp_update_post($args, true);
            if (is_wp_error($result)) {
                self::audit('update_page', $pageId, 'failure');
                return new WP_Error('update_failed', $result->get_error_message(), ['status' => 500]);
            }

            if (array_key_exists('builder_payload', $body) && is_array($body['builder_payload'])) {
                $stored = self::store_builder_payload($pageId, $body['builder_payload']);
                if (is_wp_error($stored)) {
                    return $stored;
                }
            }

            if (!empty($body['meta']) && is_array($body['meta'])) {
                $meta = self::validate_meta_keys($body['meta'], self::ALLOWED_PAGE_META);
                foreach ($meta as $metaKey => $metaValue) {
                    update_post_meta($pageId, $metaKey, $metaValue);
                }
            }

            self::audit('update_page', $pageId, 'success');
            return ['id' => $pageId, 'status' => get_post_status($pageId)];
        }

        return self::escape_response([
            'id' => $page->ID,
            'title' => $page->post_title,
            'status' => $page->post_status,
            'content' => $page->post_content,
        ]);
    }

    public static function handle_page_publish($request) {
        $pageId = (int) $request->get_param('id');
        $page = get_post($pageId);

        if (!$page || $page->post_type !== 'page') {
            return new WP_Error('not_found', 'Page not found', ['status' => 404]);
        }

        $result = wp_update_post(['ID' => $pageId, 'post_status' => 'publish'], true);
        if (is_wp_error($result)) {
            self::audit('publish_page', $pageId, 'failure');
            return new WP_Error('publish_failed', $result->get_error_message(), ['status' => 500]);
        }

        self::audit('publish_page', $pageId, 'success');
        return ['id' => $pageId, 'status' => 'publish'];
    }

    public static function handle_page_builder($request) {
        $pageId = (int) $request->get_param('id');
        $page = get_post($pageId);

        if (!$page || $page->post_type !== 'page') {
            return new WP_Error('not_found', 'Page not found', ['status' => 404]);
        }

        if ($request->get_method() === 'POST') {
            $body = $request->get_json_params();
            $payload = isset($body['builder_payload']) && is_array($body['builder_payload']) ? $body['builder_payload'] : [];
            $stored = self::store_builder_payload($pageId, $payload);
            if (is_wp_error($stored)) {
                return $stored;
            }
            self::audit('save_builder_payload', $pageId, 'success');
            return ['id' => $pageId, 'saved' => true];
        }

        return ['id' => $pageId, 'builder_payload' => self::read_builder_payload($pageId)];
    }

    public static function handle_templates($request) {
        if ($request->get_method() === 'POST') {
            $body = $request->get_json_params();
            $title = isset($body['title']) ? sanitize_text_field($body['title']) : 'Untitled template';
            $type = isset($body['type']) ? sanitize_key($body['type']) : 'custom';

            if (!in_array($type, self::ALLOWED_TEMPLATE_TYPES, true)) {
                return new WP_Error('invalid_request', 'Unsupported template type', ['status' => 400]);
            }

            $postId = wp_insert_post([
                'post_title' => $title,
                'post_type' => 'template',
                'post_status' => 'draft',
                'post_content' => isset($body['content']) ? wp_kses_post($body['content']) : '',
            ], true);

            if (is_wp_error($postId)) {
                self::audit('create_template', '', 'failure');
                return new WP_Error('create_failed', $postId->get_error_message(), ['status' => 500]);
            }

            update_post_meta($postId, 'mfn_template_type', $type);

            if (!empty($body['builder_payload']) && is_array($body['builder_payload'])) {
                $stored = self::store_builder_payload($postId, $body['builder_payload']);
                if (is_wp_error($stored)) {
                    return $stored;
                }
            }

            if (!empty($body['meta']) && is_array($body['meta'])) {
                $meta = self::validate_meta_keys($body['meta'], self::ALLOWED_TEMPLATE_META);
                foreach ($meta as $metaKey => $metaValue) {
                    update_post_meta($postId, $metaKey, $metaValue);
                }
            }

            self::audit('create_template', $postId, 'success');
            return ['id' => $postId, 'status' => 'draft'];
        }

        $templates = get_posts(['post_type' => 'template', 'posts_per_page' => 20, 'post_status' => 'any']);
        return array_map(function ($template) {
            return [
                'id' => $template->ID,
                'title' => esc_html($template->post_title),
                'status' => $template->post_status,
            ];
        }, $templates);
    }

    public static function handle_template_detail($request) {
        $templateId = (int) $request->get_param('id');
        $template = get_post($templateId);

        if (!$template || $template->post_type !== 'template') {
            return new WP_Error('not_found', 'Template not found', ['status' => 404]);
        }

        if ($request->get_method() === 'PUT') {
            $body = $request->get_json_params();
            $args = ['ID' => $templateId];

            if (!empty($body['title'])) {
                $args['post_title'] = sanitize_text_field($body['title']);
            }

            if (array_key_exists('content', $body)) {
                $args['post_content'] = wp_kses_post($body['content']);
            }

            if (array_key_exists('status', $body)) {
                $args['post_status'] = self::sanitize_post_status($body['status']);
            }

            $result = wp_update_post($args, true);
            if (is_wp_error($result)) {
                self::audit('update_template', $templateId, 'failure');
                return new WP_Error('update_failed', $result->get_error_message(), ['status' => 500]);
            }

            if (!empty($body['type'])) {
                $type = sanitize_key($body['type']);
                if (in_array($type, self::ALLOWED_TEMPLATE_TYPES, true)) {
                    update_post_meta($templateId, 'mfn_template_type', $type);
                }
            }

            if (array_key_exists('builder_payload', $body) && is_array($body['builder_payload'])) {
                $stored = self::store_builder_payload($templateId, $body['builder_payload']);
                if (is_wp_error($stored)) {
                    return $stored;
                }
            }

            if (!empty($body['meta']) && is_array($body['meta'])) {
                $meta = self::validate_meta_keys($body['meta'], self::ALLOWED_TEMPLATE_META);
                foreach ($meta as $metaKey => $metaValue) {
                    update_post_meta($templateId, $metaKey, $metaValue);
                }
            }

            self::audit('update_template', $templateId, 'success');
            return ['id' => $templateId, 'status' => get_post_status($templateId)];
        }

        return self::escape_response([
            'id' => $template->ID,
            'title' => $template->post_title,
            'status' => $template->post_status,
            'content' => $template->post_content,
        ]);
    }

    public static function handle_plugins($request) {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugins = get_plugins();
        return array_map(function ($plugin, $path) {
            return [
                'path' => sanitize_text_field($path),
                'name' => isset($plugin['Name']) ? esc_html($plugin['Name']) : esc_html($path),
                'active' => is_plugin_active($path),
            ];
        }, $plugins, array_keys($plugins));
    }

    private static function resolve_plugin_path($slug) {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugins = get_plugins();
        foreach ($plugins as $path => $data) {
            if (strpos($path, $slug . '/') === 0 || $path === $slug . '.php') {
                return $path;
            }
        }

        $candidate = $slug . '/' . $slug . '.php';
        if (file_exists(WP_PLUGIN_DIR . '/' . $candidate)) {
            return $candidate;
        }

        return '';
    }

    public static function handle_plugin_install($request) {
        $body = $request->get_json_params();
        $slug = isset($body['slug']) ? sanitize_key($body['slug']) : '';

        if (!$slug) {
            return new WP_Error('invalid_request', 'Plugin slug is required', ['status' => 400]);
        }

        if (!defined('BETHEME_MCP_ALLOW_PLUGIN_INSTALL') || !BETHEME_MCP_ALLOW_PLUGIN_INSTALL) {
            return new WP_Error('plugin_install_disabled', 'Plugin installation is disabled by policy', ['status' => 403]);
        }

        include_once ABSPATH . 'wp-admin/includes/plugin-install.php';
        include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

        $api = plugins_api('plugin_information', ['slug' => $slug, 'fields' => ['short_description' => true]]);
        if (is_wp_error($api)) {
            self::audit('install_plugin', $slug, 'failure');
            return new WP_Error('plugin_install_failed', $api->get_error_message(), ['status' => 500]);
        }

        $upgrader = new Plugin_Upgrader(new Automatic_Upgrader_Skin());
        $result = $upgrader->install($api->download_link);

        if (is_wp_error($result)) {
            self::audit('install_plugin', $slug, 'failure');
            return new WP_Error('plugin_install_failed', $result->get_error_message(), ['status' => 500]);
        }

        $pluginPath = self::resolve_plugin_path($slug);
        if ($pluginPath) {
            activate_plugin($pluginPath);
        }

        self::audit('install_plugin', $slug, 'success');
        return ['slug' => $slug, 'activated' => (bool) $pluginPath];
    }

    public static function handle_plugin_activate($request) {
        $body = $request->get_json_params();
        $slug = isset($body['slug']) ? sanitize_key($body['slug']) : '';

        if (!$slug) {
            return new WP_Error('invalid_request', 'Plugin slug is required', ['status' => 400]);
        }

        $pluginPath = self::resolve_plugin_path($slug);
        if (!$pluginPath) {
            return new WP_Error('plugin_not_found', 'Plugin could not be located', ['status' => 404]);
        }

        if (!function_exists('activate_plugin')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $result = activate_plugin($pluginPath);
        if (is_wp_error($result)) {
            self::audit('activate_plugin', $slug, 'failure');
            return new WP_Error('plugin_activate_failed', $result->get_error_message(), ['status' => 500]);
        }

        self::audit('activate_plugin', $slug, 'success');
        return ['slug' => $slug, 'activated' => true];
    }

    public static function handle_plugin_deactivate($request) {
        $body = $request->get_json_params();
        $slug = isset($body['slug']) ? sanitize_key($body['slug']) : '';

        if (!$slug) {
            return new WP_Error('invalid_request', 'Plugin slug is required', ['status' => 400]);
        }

        $pluginPath = self::resolve_plugin_path($slug);
        if (!$pluginPath) {
            return new WP_Error('plugin_not_found', 'Plugin could not be located', ['status' => 404]);
        }

        if (!function_exists('deactivate_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        deactivate_plugins([$pluginPath]);
        self::audit('deactivate_plugin', $slug, 'success');
        return ['slug' => $slug, 'deactivated' => true];
    }
}

BeTheme_Mcp_Bridge::bootstrap();
