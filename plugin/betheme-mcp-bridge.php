<?php
/**
 * Plugin Name: BeTheme MCP Bridge
 * Description: Secure bridge endpoints for an MCP server to manage WordPress and BeTheme content.
 * Version: 28.5.4
 * Author: BeTheme MCP Project
 */

if (!defined('ABSPATH')) {
    exit;
}

class BeTheme_Mcp_Bridge {
    public static function bootstrap() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
    }

    public static function register_routes() {
        register_rest_route('betheme-mcp/v1', '/health', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'health'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);

        register_rest_route('betheme-mcp/v1', '/site', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'site_context'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);

        register_rest_route('betheme-mcp/v1', '/capabilities', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'capabilities'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);

        register_rest_route('betheme-mcp/v1', '/pages', [
            'methods' => ['GET', 'POST'],
            'callback' => [__CLASS__, 'handle_pages'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);

        register_rest_route('betheme-mcp/v1', '/pages/(?P<id>\d+)', [
            'methods' => ['GET', 'PUT', 'DELETE'],
            'callback' => [__CLASS__, 'handle_page_detail'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);

        register_rest_route('betheme-mcp/v1', '/pages/(?P<id>\d+)/publish', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'handle_page_publish'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);

        register_rest_route('betheme-mcp/v1', '/pages/(?P<id>\d+)/builder', [
            'methods' => ['GET', 'POST'],
            'callback' => [__CLASS__, 'handle_page_builder'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);

        register_rest_route('betheme-mcp/v1', '/templates', [
            'methods' => ['GET', 'POST'],
            'callback' => [__CLASS__, 'handle_templates'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);

        register_rest_route('betheme-mcp/v1', '/templates/(?P<id>\d+)', [
            'methods' => ['GET', 'PUT'],
            'callback' => [__CLASS__, 'handle_template_detail'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);

        register_rest_route('betheme-mcp/v1', '/plugins', [
            'methods' => 'GET',
            'callback' => [__CLASS__, 'handle_plugins'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);

        register_rest_route('betheme-mcp/v1', '/plugins/install', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'handle_plugin_install'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);

        register_rest_route('betheme-mcp/v1', '/plugins/activate', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'handle_plugin_activate'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);

        register_rest_route('betheme-mcp/v1', '/plugins/deactivate', [
            'methods' => 'POST',
            'callback' => [__CLASS__, 'handle_plugin_deactivate'],
            'permission_callback' => [__CLASS__, 'permission_check']
        ]);
    }

    public static function permission_check($request) {
        $apiKey = $request->get_header('x-api-key');
        $expected = defined('BETHEME_MCP_API_KEY') ? BETHEME_MCP_API_KEY : '';

        if (!$expected || !hash_equals($expected, (string) $apiKey)) {
            return new WP_Error('rest_forbidden', 'Authentication required', ['status' => 401]);
        }

        if (!current_user_can('edit_posts')) {
            return new WP_Error('rest_forbidden', 'Insufficient capability', ['status' => 403]);
        }

        return true;
    }

    public static function health($request) {
        return ['ok' => true, 'site' => get_bloginfo('name')];
    }

    public static function site_context($request) {
        $theme = wp_get_theme();
        return [
            'site' => get_bloginfo('name'),
            'url' => home_url('/'),
            'theme' => $theme->get('Name'),
            'themeVersion' => $theme->get('Version')
        ];
    }

    public static function capabilities($request) {
        return [
            'version' => '28.5.4',
            'authenticated' => true,
            'capabilities' => [
                'pages',
                'templates',
                'plugins',
                'builder_metadata'
            ]
        ];
    }

    public static function handle_pages($request) {
        if ($request->get_method() === 'POST') {
            $body = $request->get_json_params();
            $postId = wp_insert_post([
                'post_title' => $body['title'] ?? 'Untitled page',
                'post_type' => 'page',
                'post_status' => 'draft',
                'post_content' => $body['content'] ?? ''
            ]);

            if (!empty($body['builder_payload'])) {
                update_post_meta($postId, 'mfn-page-items', wp_json_encode($body['builder_payload']));
            }

            if (!empty($body['meta']) && is_array($body['meta'])) {
                foreach ($body['meta'] as $metaKey => $metaValue) {
                    update_post_meta($postId, $metaKey, $metaValue);
                }
            }

            return ['id' => $postId, 'status' => 'draft'];
        }

        $pages = get_posts(['post_type' => 'page', 'posts_per_page' => 10, 'post_status' => 'any']);
        return array_map(function ($page) {
            return ['id' => $page->ID, 'title' => $page->post_title, 'status' => $page->post_status];
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
                return new WP_Error('delete_failed', 'Page could not be deleted', ['status' => 500]);
            }
            return ['id' => $pageId, 'deleted' => true];
        }

        if ($request->get_method() === 'PUT') {
            $body = $request->get_json_params();
            $args = ['ID' => $pageId];

            if (!empty($body['title'])) {
                $args['post_title'] = $body['title'];
            }

            if (array_key_exists('content', $body)) {
                $args['post_content'] = $body['content'];
            }

            if (!empty($body['status'])) {
                $args['post_status'] = $body['status'];
            }

            wp_update_post($args);

            if (!empty($body['builder_payload'])) {
                update_post_meta($pageId, 'mfn-page-items', wp_json_encode($body['builder_payload']));
            }

            if (!empty($body['meta']) && is_array($body['meta'])) {
                foreach ($body['meta'] as $metaKey => $metaValue) {
                    update_post_meta($pageId, $metaKey, $metaValue);
                }
            }

            return ['id' => $pageId, 'status' => get_post_status($pageId)];
        }

        return ['id' => $page->ID, 'title' => $page->post_title, 'status' => $page->post_status, 'content' => $page->post_content];
    }

    public static function handle_page_publish($request) {
        $pageId = (int) $request->get_param('id');
        $result = wp_update_post(['ID' => $pageId, 'post_status' => 'publish']);

        if (is_wp_error($result)) {
            return new WP_Error('publish_failed', $result->get_error_message(), ['status' => 500]);
        }

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
            $payload = $body['builder_payload'] ?? [];
            update_post_meta($pageId, 'mfn-page-items', wp_json_encode($payload));
            return ['id' => $pageId, 'saved' => true];
        }

        $payload = get_post_meta($pageId, 'mfn-page-items', true);
        return ['id' => $pageId, 'builder_payload' => $payload ? json_decode($payload, true) : []];
    }

    public static function handle_templates($request) {
        if ($request->get_method() === 'POST') {
            $body = $request->get_json_params();
            $postId = wp_insert_post([
                'post_title' => $body['title'] ?? 'Untitled template',
                'post_type' => 'template',
                'post_status' => 'draft',
                'post_content' => $body['content'] ?? ''
            ]);

            update_post_meta($postId, 'mfn_template_type', $body['type'] ?? 'custom');

            if (!empty($body['builder_payload'])) {
                update_post_meta($postId, 'mfn-page-items', wp_json_encode($body['builder_payload']));
            }

            if (!empty($body['meta']) && is_array($body['meta'])) {
                foreach ($body['meta'] as $metaKey => $metaValue) {
                    update_post_meta($postId, $metaKey, $metaValue);
                }
            }

            return ['id' => $postId, 'status' => 'draft'];
        }

        $templates = get_posts(['post_type' => 'template', 'posts_per_page' => 10, 'post_status' => 'any']);
        return array_map(function ($template) {
            return ['id' => $template->ID, 'title' => $template->post_title, 'status' => $template->post_status];
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
                $args['post_title'] = $body['title'];
            }

            if (array_key_exists('content', $body)) {
                $args['post_content'] = $body['content'];
            }

            if (!empty($body['type'])) {
                update_post_meta($templateId, 'mfn_template_type', $body['type']);
            }

            if (!empty($body['builder_payload'])) {
                update_post_meta($templateId, 'mfn-page-items', wp_json_encode($body['builder_payload']));
            }

            wp_update_post($args);

            return ['id' => $templateId, 'status' => get_post_status($templateId)];
        }

        return ['id' => $template->ID, 'title' => $template->post_title, 'status' => $template->post_status, 'content' => $template->post_content];
    }

    public static function handle_plugins($request) {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugins = get_plugins();
        return array_map(function ($plugin, $path) {
            return ['path' => $path, 'name' => $plugin['Name'] ?? $path, 'active' => is_plugin_active($path)];
        }, $plugins, array_keys($plugins));
    }

    public static function handle_plugin_install($request) {
        $body = $request->get_json_params();
        $slug = $body['slug'] ?? '';

        if (!$slug) {
            return new WP_Error('invalid_request', 'Plugin slug is required', ['status' => 400]);
        }

        include_once ABSPATH . 'wp-admin/includes/plugin-install.php';
        include_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

        $api = plugins_api('plugin_information', ['slug' => $slug, 'fields' => ['short_description' => true]]);
        if (is_wp_error($api)) {
            return new WP_Error('plugin_install_failed', $api->get_error_message(), ['status' => 500]);
        }

        $upgrader = new Plugin_Upgrader(new Automatic_Upgrader_Skin());
        $result = $upgrader->install($api->download_link);

        if (is_wp_error($result)) {
            return new WP_Error('plugin_install_failed', $result->get_error_message(), ['status' => 500]);
        }

        $pluginPath = $slug . '/' . $slug . '.php';
        activate_plugin($pluginPath);

        return ['slug' => $slug, 'activated' => true];
    }

    public static function handle_plugin_activate($request) {
        $body = $request->get_json_params();
        $slug = $body['slug'] ?? '';

        if (!$slug) {
            return new WP_Error('invalid_request', 'Plugin slug is required', ['status' => 400]);
        }

        $pluginPath = $slug . '/' . $slug . '.php';
        if (!function_exists('activate_plugin')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $result = activate_plugin($pluginPath);
        if (is_wp_error($result)) {
            return new WP_Error('plugin_activate_failed', $result->get_error_message(), ['status' => 500]);
        }

        return ['slug' => $slug, 'activated' => true];
    }

    public static function handle_plugin_deactivate($request) {
        $body = $request->get_json_params();
        $slug = $body['slug'] ?? '';

        if (!$slug) {
            return new WP_Error('invalid_request', 'Plugin slug is required', ['status' => 400]);
        }

        $pluginPath = $slug . '/' . $slug . '.php';
        if (!function_exists('deactivate_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        deactivate_plugins([$pluginPath]);
        return ['slug' => $slug, 'deactivated' => true];
    }
}

BeTheme_Mcp_Bridge::bootstrap();
