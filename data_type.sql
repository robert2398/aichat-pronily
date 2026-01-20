-- ============================================================================
-- Database Schema: Data Types and Table Structures
-- ============================================================================
-- Generated: 2026-01-20 10:32:34
-- Database: pornily
-- Schema: public
--
-- This file contains the complete schema information including:
-- - Custom ENUM types
-- - Table structures with column data types
-- - Primary keys, foreign keys, and constraints
-- - Indexes
-- ============================================================================


-- ============================================================================
-- CUSTOM ENUM TYPES
-- ============================================================================

-- ENUM: role_enum
-- Values: ADMIN, USER
CREATE TYPE role_enum AS ENUM ('ADMIN', 'USER');


-- ============================================================================
-- TABLES (24 total)
-- ============================================================================


-- ============================================================================
-- TABLE: ai_editor
-- ============================================================================

-- Columns for table: ai_editor
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('ai_editor_id_seq'::regclass)
-- user_id                        VARCHAR(64)                    YES        NULL
-- image_gen_id                   VARCHAR                        NO         NULL
-- mime_type                      VARCHAR                        YES        'image/png'::character varying
-- s3_path_image_gen              TEXT                           YES        NULL
-- s3_path_source_image           TEXT                           YES        NULL
-- status                         VARCHAR                        NO         'pending'::character varying
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- media_type                     VARCHAR(50)                    YES        'image'::character varying

-- Constraints for table: ai_editor
--   PRIMARY KEY:
--     ai_editor_pkey: id
--   FOREIGN KEYS:
--     ai_editor_user_id_fkey: user_id -> users(id) ON DELETE CASCADE
--   CHECK:
--     2200_16393_1_not_null
--     2200_16393_3_not_null
--     2200_16393_7_not_null
--     2200_16393_8_not_null

-- Indexes for table: ai_editor
--   ai_editor_pkey
--     CREATE UNIQUE INDEX ai_editor_pkey ON public.ai_editor USING btree (id)



-- ============================================================================
-- TABLE: ai_story
-- ============================================================================

-- Columns for table: ai_story
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('ai_story_id_seq'::regclass)
-- user_id                        VARCHAR(64)                    YES        NULL
-- user_prompt                    TEXT                           NO         NULL
-- title                          TEXT                           YES        NULL
-- story                          TEXT                           YES        NULL
-- read_count                     INTEGER                        NO         0
-- likes_count                    INTEGER                        NO         0
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: ai_story
--   PRIMARY KEY:
--     ai_story_pkey: id
--   FOREIGN KEYS:
--     ai_story_user_id_fkey: user_id -> users(id) ON DELETE CASCADE
--   CHECK:
--     2200_16403_1_not_null
--     2200_16403_3_not_null
--     2200_16403_6_not_null
--     2200_16403_7_not_null
--     2200_16403_8_not_null

-- Indexes for table: ai_story
--   ai_story_pkey
--     CREATE UNIQUE INDEX ai_story_pkey ON public.ai_story USING btree (id)



-- ============================================================================
-- TABLE: alembic_version
-- ============================================================================

-- Columns for table: alembic_version
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- version_num                    VARCHAR(32)                    NO         NULL

-- Constraints for table: alembic_version
--   PRIMARY KEY:
--     alembic_version_pkc: version_num
--   CHECK:
--     2200_16412_1_not_null

-- Indexes for table: alembic_version
--   alembic_version_pkc
--     CREATE UNIQUE INDEX alembic_version_pkc ON public.alembic_version USING btree (version_num)



-- ============================================================================
-- TABLE: app_config
-- ============================================================================

-- Columns for table: app_config
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('app_config_id_seq'::regclass)
-- category                       TEXT                           NO         NULL
-- parameter_name                 VARCHAR                        NO         NULL
-- parameter_value                TEXT                           NO         NULL
-- parameter_description          TEXT                           YES        NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- updated_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: app_config
--   PRIMARY KEY:
--     app_config_pkey: id
--   UNIQUE:
--     app_config_parameter_name_key: parameter_name
--   CHECK:
--     2200_16415_1_not_null
--     2200_16415_2_not_null
--     2200_16415_3_not_null
--     2200_16415_4_not_null
--     2200_16415_6_not_null
--     2200_16415_7_not_null

-- Indexes for table: app_config
--   app_config_parameter_name_key
--     CREATE UNIQUE INDEX app_config_parameter_name_key ON public.app_config USING btree (parameter_name)
--   app_config_pkey
--     CREATE UNIQUE INDEX app_config_pkey ON public.app_config USING btree (id)
--   ix_app_config_id
--     CREATE INDEX ix_app_config_id ON public.app_config USING btree (id)



-- ============================================================================
-- TABLE: character_media
-- ============================================================================

-- Columns for table: character_media
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(32)                    NO         NULL
-- character_id                   VARCHAR(64)                    YES        NULL
-- user_id                        VARCHAR(64)                    NO         NULL
-- media_type                     VARCHAR                        NO         'image'::character varying
-- s3_path                        TEXT                           NO         NULL
-- mime_type                      VARCHAR                        NO         'image/png'::character varying
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: character_media
--   PRIMARY KEY:
--     character_media_pkey: id
--   FOREIGN KEYS:
--     fk_character_media_character: character_id -> characters(id) ON DELETE CASCADE
--     fk_character_media_user: user_id -> users(id) ON DELETE CASCADE
--   UNIQUE:
--     character_media_s3_path_key: s3_path
--   CHECK:
--     2200_16423_1_not_null
--     2200_16423_3_not_null
--     2200_16423_4_not_null
--     2200_16423_5_not_null
--     2200_16423_6_not_null
--     2200_16423_7_not_null

-- Indexes for table: character_media
--   character_media_pkey
--     CREATE UNIQUE INDEX character_media_pkey ON public.character_media USING btree (id)
--   character_media_s3_path_key
--     CREATE UNIQUE INDEX character_media_s3_path_key ON public.character_media USING btree (s3_path)



-- ============================================================================
-- TABLE: character_stats
-- ============================================================================

-- Columns for table: character_stats
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('character_stats_id_seq'::regclass)
-- character_id                   VARCHAR(64)                    NO         NULL
-- user_id                        VARCHAR(64)                    NO         NULL
-- liked                          BOOLEAN                        YES        false
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: character_stats
--   PRIMARY KEY:
--     character_stats_pkey: id
--   FOREIGN KEYS:
--     character_stats_character_id_fkey: character_id -> characters(id) ON DELETE NO ACTION
--     character_stats_user_id_fkey: user_id -> users(id) ON DELETE NO ACTION
--   CHECK:
--     2200_16432_1_not_null
--     2200_16432_2_not_null
--     2200_16432_3_not_null
--     2200_16432_5_not_null

-- Indexes for table: character_stats
--   character_stats_pkey
--     CREATE UNIQUE INDEX character_stats_pkey ON public.character_stats USING btree (id)



-- ============================================================================
-- TABLE: character_video
-- ============================================================================

-- Columns for table: character_video
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('character_video_id_seq'::regclass)
-- character_id                   VARCHAR(64)                    YES        NULL
-- user_id                        VARCHAR(64)                    YES        NULL
-- s3_path                        TEXT                           NO         NULL
-- mime_type                      VARCHAR                        NO         NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         NULL

-- Constraints for table: character_video
--   PRIMARY KEY:
--     character_video_pkey: id
--   FOREIGN KEYS:
--     character_video_character_id_fkey: character_id -> characters(id) ON DELETE CASCADE
--     character_video_user_id_fkey: user_id -> users(id) ON DELETE CASCADE
--   UNIQUE:
--     character_video_s3_path_key: s3_path
--   CHECK:
--     2200_16438_1_not_null
--     2200_16438_4_not_null
--     2200_16438_5_not_null
--     2200_16438_6_not_null

-- Indexes for table: character_video
--   character_video_pkey
--     CREATE UNIQUE INDEX character_video_pkey ON public.character_video USING btree (id)
--   character_video_s3_path_key
--     CREATE UNIQUE INDEX character_video_s3_path_key ON public.character_video USING btree (s3_path)



-- ============================================================================
-- TABLE: characters
-- ============================================================================

-- Columns for table: characters
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('characters_id_seq'::regclass)
-- username                       VARCHAR                        NO         NULL
-- bio                            TEXT                           YES        NULL
-- user_id                        VARCHAR(64)                    NO         NULL
-- name                           VARCHAR                        NO         NULL
-- gender                         VARCHAR(50)                    NO         NULL
-- style                          VARCHAR                        YES        NULL
-- ethnicity                      VARCHAR(50)                    YES        NULL
-- age                            INTEGER                        YES        NULL
-- eye_colour                     VARCHAR(50)                    YES        NULL
-- hair_style                     VARCHAR(50)                    YES        NULL
-- hair_colour                    VARCHAR(50)                    YES        NULL
-- body_type                      VARCHAR(50)                    YES        NULL
-- breast_size                    VARCHAR(50)                    YES        NULL
-- butt_size                      VARCHAR(50)                    YES        NULL
-- dick_size                      VARCHAR(50)                    YES        NULL
-- personality                    TEXT                           YES        NULL
-- voice_type                     VARCHAR(50)                    YES        NULL
-- relationship_type              VARCHAR(50)                    YES        NULL
-- clothing                       VARCHAR                        YES        NULL
-- special_features               TEXT                           YES        NULL
-- prompt                         VARCHAR                        NO         NULL
-- image_url_s3                   TEXT                           YES        NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         NULL
-- updated_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- privacy                        VARCHAR(255)                   YES        NULL

-- Constraints for table: characters
--   PRIMARY KEY:
--     characters_pkey: id
--   FOREIGN KEYS:
--     characters_user_id_fkey: user_id -> users(id) ON DELETE NO ACTION
--   CHECK:
--     2200_16444_1_not_null
--     2200_16444_22_not_null
--     2200_16444_24_not_null
--     2200_16444_25_not_null
--     2200_16444_2_not_null
--     2200_16444_4_not_null
--     2200_16444_5_not_null
--     2200_16444_6_not_null

-- Indexes for table: characters
--   characters_pkey
--     CREATE UNIQUE INDEX characters_pkey ON public.characters USING btree (id)
--   ix_characters_id
--     CREATE INDEX ix_characters_id ON public.characters USING btree (id)



-- ============================================================================
-- TABLE: chat_messages
-- ============================================================================

-- Columns for table: chat_messages
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('chat_messages_id_seq'::regclass)
-- session_id                     VARCHAR(64)                    NO         NULL
-- user_id                        VARCHAR(64)                    NO         NULL
-- character_id                   VARCHAR(64)                    NO         NULL
-- user_query                     TEXT                           NO         NULL
-- ai_message                     TEXT                           YES        NULL
-- context_window                 INTEGER                        YES        NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- is_media_available             BOOLEAN                        YES        NULL
-- media_type                     VARCHAR(250)                   YES        NULL
-- s3_url_media                   TEXT                           YES        NULL

-- Constraints for table: chat_messages
--   PRIMARY KEY:
--     chat_messages_pkey: id
--   FOREIGN KEYS:
--     chat_messages_character_id_fkey: character_id -> characters(id) ON DELETE NO ACTION
--     chat_messages_user_id_fkey: user_id -> users(id) ON DELETE NO ACTION
--   CHECK:
--     2200_16451_1_not_null
--     2200_16451_2_not_null
--     2200_16451_3_not_null
--     2200_16451_4_not_null
--     2200_16451_5_not_null
--     2200_16451_8_not_null

-- Indexes for table: chat_messages
--   chat_messages_pkey
--     CREATE UNIQUE INDEX chat_messages_pkey ON public.chat_messages USING btree (id)
--   ix_chat_messages_character_id
--     CREATE INDEX ix_chat_messages_character_id ON public.chat_messages USING btree (character_id)
--   ix_chat_messages_session_id
--     CREATE INDEX ix_chat_messages_session_id ON public.chat_messages USING btree (session_id)
--   ix_chat_messages_user_id
--     CREATE INDEX ix_chat_messages_user_id ON public.chat_messages USING btree (user_id)



-- ============================================================================
-- TABLE: coin_transactions
-- ============================================================================

-- Columns for table: coin_transactions
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(32)                    NO         NULL
-- user_id                        VARCHAR(64)                    NO         NULL
-- transaction_type               VARCHAR(50)                    NO         NULL
-- coins                          INTEGER                        NO         NULL
-- source_type                    VARCHAR(50)                    NO         NULL
-- order_id                       VARCHAR(32)                    YES        NULL
-- period_start                   TIMESTAMP                      YES        NULL
-- period_end                     TIMESTAMP                      YES        NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- character_id                   VARCHAR(64)                    YES        NULL

-- Constraints for table: coin_transactions
--   PRIMARY KEY:
--     coin_transactions_pkey: id
--   FOREIGN KEYS:
--     coin_transactions_order_id_fkey: order_id -> orders(id) ON DELETE NO ACTION
--     fk_character: character_id -> characters(id) ON DELETE NO ACTION
--     fk_coin_transactions_user: user_id -> users(id) ON DELETE CASCADE
--   CHECK:
--     2200_16458_1_not_null
--     2200_16458_2_not_null
--     2200_16458_3_not_null
--     2200_16458_4_not_null
--     2200_16458_5_not_null
--     2200_16458_9_not_null

-- Indexes for table: coin_transactions
--   coin_transactions_pkey
--     CREATE UNIQUE INDEX coin_transactions_pkey ON public.coin_transactions USING btree (id)



-- ============================================================================
-- TABLE: email_verifications
-- ============================================================================

-- Columns for table: email_verifications
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         NULL
-- user_id                        VARCHAR(64)                    NO         NULL
-- code_hash                      VARCHAR                        NO         NULL
-- sent_to_email                  VARCHAR                        NO         NULL
-- expires_at                     TIMESTAMP WITH TIME ZONE       NO         NULL
-- consumed_at                    TIMESTAMP WITH TIME ZONE       YES        NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: email_verifications
--   PRIMARY KEY:
--     email_verifications_pkey: id
--   FOREIGN KEYS:
--     email_verifications_user_id_fkey: user_id -> users(id) ON DELETE CASCADE
--   CHECK:
--     2200_16463_1_not_null
--     2200_16463_2_not_null
--     2200_16463_3_not_null
--     2200_16463_4_not_null
--     2200_16463_5_not_null
--     2200_16463_7_not_null

-- Indexes for table: email_verifications
--   email_verifications_pkey
--     CREATE UNIQUE INDEX email_verifications_pkey ON public.email_verifications USING btree (id)



-- ============================================================================
-- TABLE: media
-- ============================================================================

-- Columns for table: media
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('media_id_seq'::regclass)
-- user_id                        VARCHAR(64)                    NO         NULL
-- media_type                     VARCHAR(50)                    NO         NULL
-- s3_url                         TEXT                           YES        NULL
-- coins_consumed                 INTEGER                        NO         NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: media
--   PRIMARY KEY:
--     media_pkey: id
--   FOREIGN KEYS:
--     media_user_id_fkey: user_id -> users(id) ON DELETE CASCADE
--   CHECK:
--     2200_16469_1_not_null
--     2200_16469_2_not_null
--     2200_16469_3_not_null
--     2200_16469_5_not_null
--     2200_16469_6_not_null
--     chk_media_type

-- Indexes for table: media
--   ix_media_id
--     CREATE INDEX ix_media_id ON public.media USING btree (id)
--   media_pkey
--     CREATE UNIQUE INDEX media_pkey ON public.media USING btree (id)



-- ============================================================================
-- TABLE: oauth_identities
-- ============================================================================

-- Columns for table: oauth_identities
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('oauth_identities_id_seq'::regclass)
-- user_id                        VARCHAR(64)                    NO         NULL
-- provider                       VARCHAR                        NO         NULL
-- provider_user_id               VARCHAR                        NO         NULL
-- email                          VARCHAR                        YES        NULL
-- full_name                      VARCHAR                        YES        NULL
-- avatar_url                     VARCHAR                        YES        NULL

-- Constraints for table: oauth_identities
--   PRIMARY KEY:
--     oauth_identities_pkey: id
--   FOREIGN KEYS:
--     oauth_identities_user_id_fkey: user_id -> users(id) ON DELETE CASCADE
--   CHECK:
--     2200_16477_1_not_null
--     2200_16477_2_not_null
--     2200_16477_3_not_null
--     2200_16477_4_not_null

-- Indexes for table: oauth_identities
--   oauth_identities_pkey
--     CREATE UNIQUE INDEX oauth_identities_pkey ON public.oauth_identities USING btree (id)



-- ============================================================================
-- TABLE: orders
-- ============================================================================

-- Columns for table: orders
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(32)                    NO         NULL
-- promo_id                       VARCHAR(64)                    YES        NULL
-- promo_code                     VARCHAR(100)                   YES        NULL
-- user_id                        VARCHAR(64)                    NO         NULL
-- discount_type                  VARCHAR(100)                   YES        NULL
-- applied_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- discount_applied               NUMERIC(10, 2)                 NO         0
-- subtotal_at_apply              NUMERIC(10, 2)                 NO         NULL
-- currency                       CHAR(3)                        NO         'USD'::bpchar
-- status                         VARCHAR(20)                    NO         'pending'::character varying
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- paygate_ipn_token              TEXT                           YES        NULL
-- paygate_address_in             TEXT                           YES        NULL
-- provider                       TEXT                           YES        NULL
-- provider_order_ref             VARCHAR(250)                   YES        NULL
-- provider_txid_in               VARCHAR(250)                   YES        NULL
-- provider_txid_out              VARCHAR(250)                   YES        NULL
-- provider_coin                  VARCHAR(50)                    YES        NULL
-- paid_value_coin                NUMERIC(18, 6)                 YES        NULL
-- pricing_id                     VARCHAR(250)                   YES        NULL
-- telegram_username              VARCHAR(255)                   YES        NULL

-- Constraints for table: orders
--   PRIMARY KEY:
--     orders_pkey: id
--   FOREIGN KEYS:
--     fk_orders_promo: promo_id -> promo_management(id) ON DELETE RESTRICT
--     fk_orders_user: user_id -> users(id) ON DELETE RESTRICT
--   CHECK:
--     2200_16483_10_not_null
--     2200_16483_11_not_null
--     2200_16483_1_not_null
--     2200_16483_4_not_null
--     2200_16483_6_not_null
--     2200_16483_7_not_null
--     2200_16483_8_not_null
--     2200_16483_9_not_null

-- Indexes for table: orders
--   orders_pkey
--     CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id)



-- ============================================================================
-- TABLE: password_resets
-- ============================================================================

-- Columns for table: password_resets
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         NULL
-- user_id                        VARCHAR(64)                    NO         NULL
-- code_hash                      VARCHAR                        NO         NULL
-- expires_at                     TIMESTAMP WITH TIME ZONE       NO         NULL
-- consumed_at                    TIMESTAMP WITH TIME ZONE       YES        NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: password_resets
--   PRIMARY KEY:
--     password_resets_pkey: id
--   FOREIGN KEYS:
--     password_resets_user_id_fkey: user_id -> users(id) ON DELETE CASCADE
--   CHECK:
--     2200_16494_1_not_null
--     2200_16494_2_not_null
--     2200_16494_3_not_null
--     2200_16494_4_not_null
--     2200_16494_6_not_null

-- Indexes for table: password_resets
--   password_resets_pkey
--     CREATE UNIQUE INDEX password_resets_pkey ON public.password_resets USING btree (id)



-- ============================================================================
-- TABLE: pricing_plan
-- ============================================================================

-- Columns for table: pricing_plan
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('pricing_plan_id_seq'::regclass)
-- plan_name                      VARCHAR(255)                   NO         NULL
-- pricing_id                     VARCHAR(255)                   NO         NULL
-- coupon                         TEXT                           YES        NULL
-- currency                       CHAR(3)                        NO         'USD'::bpchar
-- price                          NUMERIC(10, 2)                 NO         NULL
-- discount                       NUMERIC(10, 2)                 YES        NULL
-- billing_cycle                  VARCHAR(50)                    NO         NULL
-- coin_reward                    INTEGER                        NO         NULL
-- status                         VARCHAR(50)                    NO         NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- updated_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: pricing_plan
--   CHECK:
--     2200_16500_10_not_null
--     2200_16500_11_not_null
--     2200_16500_12_not_null
--     2200_16500_1_not_null
--     2200_16500_2_not_null
--     2200_16500_3_not_null
--     2200_16500_5_not_null
--     2200_16500_6_not_null
--     2200_16500_8_not_null
--     2200_16500_9_not_null

-- Indexes for table: pricing_plan
--   ix_pricing_plan_plan_id
--     CREATE INDEX ix_pricing_plan_plan_id ON public.pricing_plan USING btree (id)



-- ============================================================================
-- TABLE: promo_management
-- ============================================================================

-- Columns for table: promo_management
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('promo_management_id_seq'::regclass)
-- promo_name                     VARCHAR(255)                   NO         NULL
-- coupon                         VARCHAR(100)                   NO         NULL
-- percent_off                    NUMERIC(5, 2)                  NO         NULL
-- start_date                     TIMESTAMP WITH TIME ZONE       YES        NULL
-- expiry_date                    TIMESTAMP WITH TIME ZONE       YES        NULL
-- status                         VARCHAR(20)                    NO         'active'::character varying
-- applied_count                  INTEGER                        NO         0
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- updated_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- discount_type                  VARCHAR(100)                   YES        NULL
-- currency                       VARCHAR(3)                     YES        NULL

-- Constraints for table: promo_management
--   PRIMARY KEY:
--     promo_management_pkey: id
--   UNIQUE:
--     promo_management_coupon_key: coupon
--   CHECK:
--     2200_16509_10_not_null
--     2200_16509_1_not_null
--     2200_16509_2_not_null
--     2200_16509_3_not_null
--     2200_16509_4_not_null
--     2200_16509_7_not_null
--     2200_16509_8_not_null
--     2200_16509_9_not_null
--     chk_coupon_upper
--     chk_dates_order
--     promo_management_percent_off_check

-- Indexes for table: promo_management
--   promo_management_coupon_key
--     CREATE UNIQUE INDEX promo_management_coupon_key ON public.promo_management USING btree (coupon)
--   promo_management_pkey
--     CREATE UNIQUE INDEX promo_management_pkey ON public.promo_management USING btree (id)



-- ============================================================================
-- TABLE: refresh_tokens
-- ============================================================================

-- Columns for table: refresh_tokens
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         NULL
-- user_id                        VARCHAR(64)                    NO         NULL
-- token_hash                     VARCHAR                        NO         NULL
-- user_agent                     VARCHAR                        YES        NULL
-- ip_address                     INET                           YES        NULL
-- expires_at                     TIMESTAMP WITH TIME ZONE       NO         NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: refresh_tokens
--   PRIMARY KEY:
--     refresh_tokens_pkey: id
--   FOREIGN KEYS:
--     refresh_tokens_user_id_fkey: user_id -> users(id) ON DELETE CASCADE
--   CHECK:
--     2200_16520_1_not_null
--     2200_16520_2_not_null
--     2200_16520_3_not_null
--     2200_16520_6_not_null
--     2200_16520_7_not_null

-- Indexes for table: refresh_tokens
--   refresh_tokens_pkey
--     CREATE UNIQUE INDEX refresh_tokens_pkey ON public.refresh_tokens USING btree (id)



-- ============================================================================
-- TABLE: story_stats
-- ============================================================================

-- Columns for table: story_stats
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('story_stats_id_seq'::regclass)
-- story_id                       VARCHAR(64)                    NO         NULL
-- user_id                        VARCHAR(64)                    NO         NULL
-- liked                          BOOLEAN                        NO         false
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: story_stats
--   PRIMARY KEY:
--     story_stats_pkey: id
--   FOREIGN KEYS:
--     story_stats_story_id_fkey: story_id -> ai_story(id) ON DELETE CASCADE
--     story_stats_user_id_fkey: user_id -> users(id) ON DELETE CASCADE
--   CHECK:
--     2200_16526_1_not_null
--     2200_16526_2_not_null
--     2200_16526_3_not_null
--     2200_16526_4_not_null
--     2200_16526_5_not_null

-- Indexes for table: story_stats
--   story_stats_pkey
--     CREATE UNIQUE INDEX story_stats_pkey ON public.story_stats USING btree (id)



-- ============================================================================
-- TABLE: subscriptions
-- ============================================================================

-- Columns for table: subscriptions
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('subscriptions_id_seq'::regclass)
-- user_id                        VARCHAR(64)                    NO         NULL
-- payment_customer_id            VARCHAR                        NO         NULL
-- subscription_id                VARCHAR                        NO         NULL
-- order_id                       VARCHAR(32)                    NO         NULL
-- price_id                       VARCHAR                        NO         NULL
-- plan_name                      VARCHAR                        NO         NULL
-- status                         VARCHAR                        NO         NULL
-- current_period_end             TIMESTAMP                      YES        NULL
-- start_date                     TIMESTAMP                      YES        NULL
-- cancel_at_period_end           BOOLEAN                        YES        NULL
-- last_rewarded_period_end       TIMESTAMP                      YES        NULL
-- total_coins_rewarded           INTEGER                        NO         NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- updated_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: subscriptions
--   PRIMARY KEY:
--     subscriptions_pkey: id
--   FOREIGN KEYS:
--     subscriptions_order_id_fkey: order_id -> orders(id) ON DELETE NO ACTION
--     subscriptions_user_id_fkey: user_id -> users(id) ON DELETE NO ACTION
--   UNIQUE:
--     subscriptions_subscription_id_key: subscription_id
--   CHECK:
--     2200_16532_13_not_null
--     2200_16532_14_not_null
--     2200_16532_15_not_null
--     2200_16532_1_not_null
--     2200_16532_2_not_null
--     2200_16532_3_not_null
--     2200_16532_4_not_null
--     2200_16532_5_not_null
--     2200_16532_6_not_null
--     2200_16532_7_not_null
--     2200_16532_8_not_null

-- Indexes for table: subscriptions
--   subscriptions_pkey
--     CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id)
--   subscriptions_subscription_id_key
--     CREATE UNIQUE INDEX subscriptions_subscription_id_key ON public.subscriptions USING btree (subscription_id)



-- ============================================================================
-- TABLE: user_activations
-- ============================================================================

-- Columns for table: user_activations
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('user_activations_id_seq'::regclass)
-- user_id                        VARCHAR(64)                    NO         NULL
-- token_hash                     VARCHAR                        NO         NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- expires_at                     TIMESTAMP WITH TIME ZONE       NO         NULL
-- consumed_at                    TIMESTAMP WITH TIME ZONE       YES        NULL

-- Constraints for table: user_activations
--   PRIMARY KEY:
--     user_activations_pkey: id
--   FOREIGN KEYS:
--     user_activations_user_id_fkey: user_id -> users(id) ON DELETE CASCADE
--   CHECK:
--     2200_16540_1_not_null
--     2200_16540_2_not_null
--     2200_16540_3_not_null
--     2200_16540_4_not_null
--     2200_16540_5_not_null

-- Indexes for table: user_activations
--   ix_user_activations_id
--     CREATE INDEX ix_user_activations_id ON public.user_activations USING btree (id)
--   user_activations_pkey
--     CREATE UNIQUE INDEX user_activations_pkey ON public.user_activations USING btree (id)



-- ============================================================================
-- TABLE: user_profiles
-- ============================================================================

-- Columns for table: user_profiles
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('user_profiles_id_seq'::regclass)
-- user_id                        VARCHAR(64)                    NO         NULL
-- full_name                      TEXT                           YES        NULL
-- email_id                       TEXT                           YES        NULL
-- username                       VARCHAR(150)                   YES        NULL
-- gender                         VARCHAR(32)                    YES        NULL
-- birth_date                     DATE                           YES        NULL
-- profile_image_url              TEXT                           YES        NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- updated_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: user_profiles
--   PRIMARY KEY:
--     user_profiles_pkey: id
--   FOREIGN KEYS:
--     fk_user_profiles_user: user_id -> users(id) ON DELETE CASCADE
--   CHECK:
--     2200_16547_10_not_null
--     2200_16547_1_not_null
--     2200_16547_2_not_null
--     2200_16547_9_not_null

-- Indexes for table: user_profiles
--   user_profiles_pkey
--     CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id)



-- ============================================================================
-- TABLE: user_wallets
-- ============================================================================

-- Columns for table: user_wallets
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('user_wallets_id_seq'::regclass)
-- user_id                        VARCHAR(64)                    NO         NULL
-- coin_balance                   INTEGER                        NO         0
-- updated_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: user_wallets
--   PRIMARY KEY:
--     user_wallets_pkey: id
--   FOREIGN KEYS:
--     user_wallets_user_id_fkey: user_id -> users(id) ON DELETE CASCADE
--   UNIQUE:
--     uq_user_wallets_user_id: user_id
--   CHECK:
--     2200_16555_1_not_null
--     2200_16555_2_not_null
--     2200_16555_3_not_null
--     2200_16555_4_not_null

-- Indexes for table: user_wallets
--   ix_user_wallets_id
--     CREATE INDEX ix_user_wallets_id ON public.user_wallets USING btree (id)
--   uq_user_wallets_user_id
--     CREATE UNIQUE INDEX uq_user_wallets_user_id ON public.user_wallets USING btree (user_id)
--   user_wallets_pkey
--     CREATE UNIQUE INDEX user_wallets_pkey ON public.user_wallets USING btree (id)



-- ============================================================================
-- TABLE: users
-- ============================================================================

-- Columns for table: users
-- Column Name                    Data Type                      Nullable   Default
-- ------------------------------ ------------------------------ ---------- ----------------------------------------
-- id                             VARCHAR(64)                    NO         nextval('users_id_seq'::regclass)
-- email                          TEXT                           NO         NULL
-- hashed_password                TEXT                           YES        NULL
-- full_name                      TEXT                           YES        NULL
-- role                           ROLE_ENUM                      NO         NULL
-- is_active                      BOOLEAN                        NO         NULL
-- is_email_verified              BOOLEAN                        NO         NULL
-- payment_customer_id            VARCHAR                        YES        NULL
-- created_at                     TIMESTAMP WITH TIME ZONE       NO         now()
-- updated_at                     TIMESTAMP WITH TIME ZONE       NO         now()

-- Constraints for table: users
--   PRIMARY KEY:
--     users_pkey: id
--   UNIQUE:
--     users_email_key: email
--   CHECK:
--     2200_16561_10_not_null
--     2200_16561_1_not_null
--     2200_16561_2_not_null
--     2200_16561_5_not_null
--     2200_16561_6_not_null
--     2200_16561_7_not_null
--     2200_16561_9_not_null

-- Indexes for table: users
--   ix_users_id
--     CREATE INDEX ix_users_id ON public.users USING btree (id)
--   users_email_key
--     CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)
--   users_pkey
--     CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)



-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total tables: 24
-- Total custom ENUM types: 1
-- Generated: 2026-01-20 10:32:54
-- ============================================================================
