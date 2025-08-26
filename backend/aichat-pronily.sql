--
-- PostgreSQL database dump
--

-- Dumped from database version 16.4
-- Dumped by pg_dump version 16.4

-- Started on 2025-08-26 20:38:14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 887 (class 1247 OID 149164)
-- Name: chat_model_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.chat_model_type AS ENUM (
    'standard',
    'premium'
);


ALTER TYPE public.chat_model_type OWNER TO postgres;

--
-- TOC entry 890 (class 1247 OID 149170)
-- Name: chat_tone_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.chat_tone_enum AS ENUM (
    'Standard',
    'NSFW',
    'Ultra-NSFW'
);


ALTER TYPE public.chat_tone_enum OWNER TO postgres;

--
-- TOC entry 896 (class 1247 OID 149190)
-- Name: image_model_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.image_model_type_enum AS ENUM (
    'text-to-image',
    'image-to-image'
);


ALTER TYPE public.image_model_type_enum OWNER TO postgres;

--
-- TOC entry 914 (class 1247 OID 149256)
-- Name: role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.role_enum AS ENUM (
    'USER',
    'ADMIN'
);


ALTER TYPE public.role_enum OWNER TO postgres;

--
-- TOC entry 908 (class 1247 OID 149238)
-- Name: speech_model_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.speech_model_type_enum AS ENUM (
    'text-to-speech',
    'speech-to-text'
);


ALTER TYPE public.speech_model_type_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 149130)
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 149150)
-- Name: app_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_config (
    id integer NOT NULL,
    category text NOT NULL,
    parameter_name character varying NOT NULL,
    parameter_value text NOT NULL,
    parameter_description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.app_config OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 149149)
-- Name: app_config_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.app_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.app_config_id_seq OWNER TO postgres;

--
-- TOC entry 5097 (class 0 OID 0)
-- Dependencies: 216
-- Name: app_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.app_config_id_seq OWNED BY public.app_config.id;


--
-- TOC entry 248 (class 1259 OID 149433)
-- Name: character_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.character_images (
    id integer NOT NULL,
    character_id integer,
    user_id integer,
    s3_path text NOT NULL,
    mime_type character varying NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.character_images OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 149432)
-- Name: character_images_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.character_images_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.character_images_id_seq OWNER TO postgres;

--
-- TOC entry 5098 (class 0 OID 0)
-- Dependencies: 247
-- Name: character_images_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.character_images_id_seq OWNED BY public.character_images.id;


--
-- TOC entry 250 (class 1259 OID 149454)
-- Name: character_video; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.character_video (
    id integer NOT NULL,
    character_id integer,
    user_id integer,
    s3_path text NOT NULL,
    mime_type character varying NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.character_video OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 149453)
-- Name: character_video_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.character_video_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.character_video_id_seq OWNER TO postgres;

--
-- TOC entry 5099 (class 0 OID 0)
-- Dependencies: 249
-- Name: character_video_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.character_video_id_seq OWNED BY public.character_video.id;


--
-- TOC entry 231 (class 1259 OID 149276)
-- Name: characters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.characters (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying NOT NULL,
    gender character varying(50) NOT NULL,
    style character varying,
    ethnicity character varying(50),
    age integer,
    eye_colour character varying(50),
    hair_style character varying(50),
    hair_colour character varying(50),
    body_type character varying(50),
    breast_size character varying(50),
    butt_size character varying(50),
    dick_size character varying(50),
    personality text,
    voice_type character varying(50),
    relationship_type character varying(50),
    clothing character varying,
    special_features text,
    prompt character varying NOT NULL,
    image_url_s3 text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    username character varying NOT NULL,
    bio text
);


ALTER TABLE public.characters OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 149275)
-- Name: characters_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.characters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.characters_id_seq OWNER TO postgres;

--
-- TOC entry 5100 (class 0 OID 0)
-- Dependencies: 230
-- Name: characters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.characters_id_seq OWNED BY public.characters.id;


--
-- TOC entry 252 (class 1259 OID 149475)
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    session_id character varying(64) NOT NULL,
    user_id integer NOT NULL,
    character_id integer NOT NULL,
    role character varying(20) NOT NULL,
    content_type character varying(20) NOT NULL,
    user_query text NOT NULL,
    ai_message text,
    audio_url_user text,
    duration_input integer,
    audio_url_output text,
    duration_output integer,
    context_window integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_messages OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 149474)
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_messages_id_seq OWNER TO postgres;

--
-- TOC entry 5101 (class 0 OID 0)
-- Dependencies: 251
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- TOC entry 219 (class 1259 OID 149178)
-- Name: chat_model; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_model (
    id integer NOT NULL,
    model_type public.chat_model_type NOT NULL,
    endpoint_id character varying NOT NULL,
    chat_tone public.chat_tone_enum NOT NULL,
    prompt_standard text,
    prompt_nsfw text,
    prompt_ultra_nsfw text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chat_model OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 149177)
-- Name: chat_model_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_model_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_model_id_seq OWNER TO postgres;

--
-- TOC entry 5102 (class 0 OID 0)
-- Dependencies: 218
-- Name: chat_model_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_model_id_seq OWNED BY public.chat_model.id;


--
-- TOC entry 254 (class 1259 OID 149498)
-- Name: coin_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.coin_transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    subscription_id integer,
    coins integer NOT NULL,
    source_type character varying(50) NOT NULL,
    source_id integer,
    description text,
    period_start timestamp without time zone,
    period_end timestamp without time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.coin_transactions OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 149497)
-- Name: coin_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.coin_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coin_transactions_id_seq OWNER TO postgres;

--
-- TOC entry 5103 (class 0 OID 0)
-- Dependencies: 253
-- Name: coin_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.coin_transactions_id_seq OWNED BY public.coin_transactions.id;


--
-- TOC entry 232 (class 1259 OID 149291)
-- Name: email_verifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_verifications (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    code_hash character varying NOT NULL,
    sent_to_email character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_verifications OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 149196)
-- Name: image_model; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.image_model (
    id integer NOT NULL,
    model_type public.image_model_type_enum NOT NULL,
    endpoint_id character varying NOT NULL,
    prompt text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.image_model OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 149195)
-- Name: image_model_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.image_model_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.image_model_id_seq OWNER TO postgres;

--
-- TOC entry 5104 (class 0 OID 0)
-- Dependencies: 220
-- Name: image_model_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.image_model_id_seq OWNED BY public.image_model.id;


--
-- TOC entry 234 (class 1259 OID 149305)
-- Name: media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.media (
    id integer NOT NULL,
    user_id integer NOT NULL,
    media_type character varying(50) NOT NULL,
    s3_url text,
    coins_consumed integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_media_type CHECK (((media_type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying, 'character'::character varying])::text[])))
);


ALTER TABLE public.media OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 149304)
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_id_seq OWNER TO postgres;

--
-- TOC entry 5105 (class 0 OID 0)
-- Dependencies: 233
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;


--
-- TOC entry 236 (class 1259 OID 149322)
-- Name: oauth_identities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.oauth_identities (
    id integer NOT NULL,
    user_id integer NOT NULL,
    provider character varying NOT NULL,
    provider_user_id character varying NOT NULL,
    email character varying,
    full_name character varying,
    avatar_url character varying
);


ALTER TABLE public.oauth_identities OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 149321)
-- Name: oauth_identities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.oauth_identities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.oauth_identities_id_seq OWNER TO postgres;

--
-- TOC entry 5106 (class 0 OID 0)
-- Dependencies: 235
-- Name: oauth_identities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.oauth_identities_id_seq OWNED BY public.oauth_identities.id;


--
-- TOC entry 237 (class 1259 OID 149335)
-- Name: password_resets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_resets (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    code_hash character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.password_resets OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 149208)
-- Name: pricing_plan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pricing_plan (
    plan_id integer NOT NULL,
    plan_name character varying(255) NOT NULL,
    pricing_id character varying(255) NOT NULL,
    currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    price numeric(10,2) NOT NULL,
    discount numeric(10,2),
    billing_cycle character varying(50) NOT NULL,
    coin_reward integer NOT NULL,
    status character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pricing_plan OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 149207)
-- Name: pricing_plan_plan_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pricing_plan_plan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pricing_plan_plan_id_seq OWNER TO postgres;

--
-- TOC entry 5107 (class 0 OID 0)
-- Dependencies: 222
-- Name: pricing_plan_plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pricing_plan_plan_id_seq OWNED BY public.pricing_plan.plan_id;


--
-- TOC entry 225 (class 1259 OID 149221)
-- Name: promo_management; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_management (
    promo_id bigint NOT NULL,
    promo_name character varying(255) NOT NULL,
    coupon character varying(100) NOT NULL,
    percent_off numeric(5,2) NOT NULL,
    start_date timestamp with time zone,
    expiry_date timestamp with time zone,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    applied_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_coupon_upper CHECK (((coupon)::text = upper((coupon)::text))),
    CONSTRAINT chk_dates_order CHECK (((expiry_date IS NULL) OR (start_date IS NULL) OR (start_date <= expiry_date))),
    CONSTRAINT chk_percent_range CHECK (((percent_off >= (0)::numeric) AND (percent_off <= (100)::numeric)))
);


ALTER TABLE public.promo_management OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 149220)
-- Name: promo_management_promo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_management_promo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_management_promo_id_seq OWNER TO postgres;

--
-- TOC entry 5108 (class 0 OID 0)
-- Dependencies: 224
-- Name: promo_management_promo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_management_promo_id_seq OWNED BY public.promo_management.promo_id;


--
-- TOC entry 239 (class 1259 OID 149349)
-- Name: promo_redemption; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.promo_redemption (
    redemption_id bigint NOT NULL,
    promo_id bigint NOT NULL,
    promo_code character varying(100) NOT NULL,
    user_id bigint NOT NULL,
    order_id bigint,
    applied_at timestamp with time zone DEFAULT now() NOT NULL,
    discount_applied numeric(10,2) NOT NULL,
    subtotal_at_apply numeric(10,2),
    currency character(3) DEFAULT 'USD'::bpchar NOT NULL,
    CONSTRAINT chk_code_upper CHECK (((promo_code)::text = upper((promo_code)::text)))
);


ALTER TABLE public.promo_redemption OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 149348)
-- Name: promo_redemption_redemption_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.promo_redemption_redemption_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.promo_redemption_redemption_id_seq OWNER TO postgres;

--
-- TOC entry 5109 (class 0 OID 0)
-- Dependencies: 238
-- Name: promo_redemption_redemption_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.promo_redemption_redemption_id_seq OWNED BY public.promo_redemption.redemption_id;


--
-- TOC entry 240 (class 1259 OID 149371)
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id uuid NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying NOT NULL,
    user_agent character varying,
    ip_address inet,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 149244)
-- Name: speech_model; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.speech_model (
    id integer NOT NULL,
    model_type public.speech_model_type_enum NOT NULL,
    endpoint_id character varying NOT NULL,
    prompt text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.speech_model OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 149243)
-- Name: speech_model_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.speech_model_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.speech_model_id_seq OWNER TO postgres;

--
-- TOC entry 5110 (class 0 OID 0)
-- Dependencies: 226
-- Name: speech_model_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.speech_model_id_seq OWNED BY public.speech_model.id;


--
-- TOC entry 242 (class 1259 OID 149385)
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    payment_customer_id character varying NOT NULL,
    payment_subscription_id character varying NOT NULL,
    price_id character varying,
    plan_name character varying,
    status character varying NOT NULL,
    current_period_end timestamp without time zone,
    start_date timestamp without time zone,
    cancel_at_period_end boolean,
    last_rewarded_period_end timestamp without time zone,
    total_coins_rewarded integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 149384)
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subscriptions_id_seq OWNER TO postgres;

--
-- TOC entry 5111 (class 0 OID 0)
-- Dependencies: 241
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- TOC entry 256 (class 1259 OID 149519)
-- Name: usage_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usage_metrics (
    id integer NOT NULL,
    user_id integer NOT NULL,
    character_id integer NOT NULL,
    tokens_input integer,
    tokens_output integer,
    "timestamp" timestamp without time zone
);


ALTER TABLE public.usage_metrics OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 149518)
-- Name: usage_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usage_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usage_metrics_id_seq OWNER TO postgres;

--
-- TOC entry 5112 (class 0 OID 0)
-- Dependencies: 255
-- Name: usage_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usage_metrics_id_seq OWNED BY public.usage_metrics.id;


--
-- TOC entry 244 (class 1259 OID 149402)
-- Name: user_activations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_activations (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token_hash character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone
);


ALTER TABLE public.user_activations OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 149401)
-- Name: user_activations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_activations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_activations_id_seq OWNER TO postgres;

--
-- TOC entry 5113 (class 0 OID 0)
-- Dependencies: 243
-- Name: user_activations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_activations_id_seq OWNED BY public.user_activations.id;


--
-- TOC entry 246 (class 1259 OID 149418)
-- Name: user_wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_wallets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    coin_balance integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_wallets OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 149417)
-- Name: user_wallets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_wallets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_wallets_id_seq OWNER TO postgres;

--
-- TOC entry 5114 (class 0 OID 0)
-- Dependencies: 245
-- Name: user_wallets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_wallets_id_seq OWNED BY public.user_wallets.id;


--
-- TOC entry 229 (class 1259 OID 149262)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    hashed_password text,
    full_name text,
    role public.role_enum NOT NULL,
    is_active boolean NOT NULL,
    is_email_verified boolean NOT NULL,
    payment_customer_id character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 149261)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5115 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4755 (class 2604 OID 149153)
-- Name: app_config id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_config ALTER COLUMN id SET DEFAULT nextval('public.app_config_id_seq'::regclass);


--
-- TOC entry 4798 (class 2604 OID 149436)
-- Name: character_images id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_images ALTER COLUMN id SET DEFAULT nextval('public.character_images_id_seq'::regclass);


--
-- TOC entry 4799 (class 2604 OID 149457)
-- Name: character_video id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_video ALTER COLUMN id SET DEFAULT nextval('public.character_video_id_seq'::regclass);


--
-- TOC entry 4779 (class 2604 OID 149279)
-- Name: characters id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters ALTER COLUMN id SET DEFAULT nextval('public.characters_id_seq'::regclass);


--
-- TOC entry 4800 (class 2604 OID 149478)
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- TOC entry 4758 (class 2604 OID 149181)
-- Name: chat_model id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_model ALTER COLUMN id SET DEFAULT nextval('public.chat_model_id_seq'::regclass);


--
-- TOC entry 4802 (class 2604 OID 149501)
-- Name: coin_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coin_transactions ALTER COLUMN id SET DEFAULT nextval('public.coin_transactions_id_seq'::regclass);


--
-- TOC entry 4761 (class 2604 OID 149199)
-- Name: image_model id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_model ALTER COLUMN id SET DEFAULT nextval('public.image_model_id_seq'::regclass);


--
-- TOC entry 4782 (class 2604 OID 149308)
-- Name: media id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);


--
-- TOC entry 4784 (class 2604 OID 149325)
-- Name: oauth_identities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_identities ALTER COLUMN id SET DEFAULT nextval('public.oauth_identities_id_seq'::regclass);


--
-- TOC entry 4764 (class 2604 OID 149211)
-- Name: pricing_plan plan_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_plan ALTER COLUMN plan_id SET DEFAULT nextval('public.pricing_plan_plan_id_seq'::regclass);


--
-- TOC entry 4768 (class 2604 OID 149224)
-- Name: promo_management promo_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_management ALTER COLUMN promo_id SET DEFAULT nextval('public.promo_management_promo_id_seq'::regclass);


--
-- TOC entry 4786 (class 2604 OID 149352)
-- Name: promo_redemption redemption_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_redemption ALTER COLUMN redemption_id SET DEFAULT nextval('public.promo_redemption_redemption_id_seq'::regclass);


--
-- TOC entry 4773 (class 2604 OID 149247)
-- Name: speech_model id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.speech_model ALTER COLUMN id SET DEFAULT nextval('public.speech_model_id_seq'::regclass);


--
-- TOC entry 4790 (class 2604 OID 149388)
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- TOC entry 4804 (class 2604 OID 149522)
-- Name: usage_metrics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_metrics ALTER COLUMN id SET DEFAULT nextval('public.usage_metrics_id_seq'::regclass);


--
-- TOC entry 4793 (class 2604 OID 149405)
-- Name: user_activations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activations ALTER COLUMN id SET DEFAULT nextval('public.user_activations_id_seq'::regclass);


--
-- TOC entry 4795 (class 2604 OID 149421)
-- Name: user_wallets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_wallets ALTER COLUMN id SET DEFAULT nextval('public.user_wallets_id_seq'::regclass);


--
-- TOC entry 4776 (class 2604 OID 149265)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5050 (class 0 OID 149130)
-- Dependencies: 215
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
c7a0a4de7a91
\.


--
-- TOC entry 5052 (class 0 OID 149150)
-- Dependencies: 217
-- Data for Name: app_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.app_config (id, category, parameter_name, parameter_value, parameter_description, created_at, updated_at) FROM stdin;
5	General	FRONTEND_URL	http://localhost:5173	Base URL of the frontend application.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
6	General	BACKEND_URL	http://127.0.0.1:8000	Base URL of the FastAPI backend server.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
7	General	AWS_REGION	eu-north-1	AWS region used for S3 and other services.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
8	General	AWS_BUCKET_NAME	aichat-pronily	Name of the S3 bucket used for storing media or assets.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
9	ChatAPI	CHAT_GEN_URL	https://api.lightspeedcloud.ai/api/v1/ollama/chat	Endpoint URL used for chat generation API.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
10	ChatAPI	CHAT_GEN_MODEL	llama3	Model name used for chat generation.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
11	ChatAPI	CHAT_GEN_USERNAME	support@deepnudify.com	Username or account identifier for chat API.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
12	ImageAPI	IMAGE_GEN_URL	https://api.lightspeedcloud.ai/api/v1/image/clone	Endpoint URL used for image generation API.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
13	ImageAPI	IMAGE_GEN_MODEL	fluxnsfw	Model name used for image generation.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
17	ImageAPI	IMAGE_GEN_USERNAME	support@deepnudify.com	Username or account identifier for image API.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
18	ImageAPI	PROMPT_ENHANCE	https://api.lightspeedcloud.ai/api/v1/prompt/generate	Endpoint URL used for enhancing prompts.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
19	VideoAPI	VIDEO_GEN_URL	https://api.lightspeedcloud.ai/api/v1/video/clone	Endpoint URL used for video generation API.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
20	VideoAPI	VIDEO_GEN_MODEL	wan2.2	Model name used for video generation.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
21	VideoAPI	VIDEO_GEN_USERNAME	support@deepnudify.com	Username or account identifier for video API.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
22	VideoAPI	VIDEO_GEN_PROMPT_ENHANCE	https://api.lightspeedcloud.ai/api/v1/prompt/generate/video	Endpoint URL used for enhancing video prompts.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
23	Stripe	STRIPE_ANNUAL_PRO_PRICE_ID	price_1RnDyQFZp40kitrQWiXjPpdA	Stripe price ID for Pro annual subscription.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
24	Stripe	STRIPE_ANNUAL_VIP_PRICE_ID	price_1RnDzwFZp40kitrQYvcwcraE	Stripe price ID for VIP annual subscription.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
25	Stripe	STRIPE_MONTHLY_PRO_PRICE_ID	price_1RnDyQFZp40kitrQWiXjPpdA	Stripe price ID for Pro monthly subscription.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
26	Stripe	STRIPE_MONTHLY_VIP_PRICE_ID	price_1RnDzwFZp40kitrQYvcwcraE	Stripe price ID for VIP monthly subscription.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
15	ImageAPI	IMAGE_GEN_STEPS	35	Number of inference steps for image generation.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
16	ImageAPI	IMAGE_GEN_CFG_SCALE	12	CFG scale (guidance scale) for image generation.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
27	ImageAPI	IMAGE_NEGATIVE_PROMPT	--no blur,--no watermark,--no extra limbs,--no distortion.	Negative prompt to be applied by model.	2025-08-26 16:16:50.904962+05:30	2025-08-26 16:16:50.904962+05:30
28	ImageAPI	IMAGE_POSITIVE_PROMPT	High Quality 8k.	Positive prompt to be applied by model.	2025-08-26 16:28:42.58569+05:30	2025-08-26 16:28:42.58569+05:30
14	ImageAPI	IMAGE_GEN_WEIGHT	0.5	Weight or guidance value for image generation.	2025-08-26 11:55:35.235605+05:30	2025-08-26 11:55:35.235605+05:30
\.


--
-- TOC entry 5083 (class 0 OID 149433)
-- Dependencies: 248
-- Data for Name: character_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.character_images (id, character_id, user_id, s3_path, mime_type, created_at) FROM stdin;
\.


--
-- TOC entry 5085 (class 0 OID 149454)
-- Dependencies: 250
-- Data for Name: character_video; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.character_video (id, character_id, user_id, s3_path, mime_type, created_at) FROM stdin;
\.


--
-- TOC entry 5066 (class 0 OID 149276)
-- Dependencies: 231
-- Data for Name: characters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.characters (id, user_id, name, gender, style, ethnicity, age, eye_colour, hair_style, hair_colour, body_type, breast_size, butt_size, dick_size, personality, voice_type, relationship_type, clothing, special_features, prompt, image_url_s3, created_at, updated_at, username, bio) FROM stdin;
1	1	Meghan Fox	female	Realistic	Asian	25	Red	Hair-1	Purple	body0	breast2	butt2		pers0	Naughty	Colleague	Summer Dress	Tattoos	Realistic style portrait of Meghan Fox, a 25-year-old asian female, with a body0 build, Red eyes, Purple Hair-1 hair, wearing Summer Dress, personality: pers0, voice: Naughty, relationship: Colleague, special features: Tattoos, — Meghan is loving and empathetic towards animal.. Ultra-detailed, 8K resolution, cinematic lighting, photorealistic textures --no blur, --no watermark, --no extra limbs, --no distortion.	character_image/admin/1/meghan_fox_20250826_184048.png	2025-08-26 18:39:29.695868+05:30	2025-08-26 18:40:48.427859+05:30	meghan_fox_20250826_184048	Meghan is loving and empathetic towards animal.
\.


--
-- TOC entry 5087 (class 0 OID 149475)
-- Dependencies: 252
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_messages (id, session_id, user_id, character_id, role, content_type, user_query, ai_message, audio_url_user, duration_input, audio_url_output, duration_output, context_window, created_at) FROM stdin;
\.


--
-- TOC entry 5054 (class 0 OID 149178)
-- Dependencies: 219
-- Data for Name: chat_model; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_model (id, model_type, endpoint_id, chat_tone, prompt_standard, prompt_nsfw, prompt_ultra_nsfw, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5089 (class 0 OID 149498)
-- Dependencies: 254
-- Data for Name: coin_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.coin_transactions (id, user_id, subscription_id, coins, source_type, source_id, description, period_start, period_end, created_at) FROM stdin;
\.


--
-- TOC entry 5067 (class 0 OID 149291)
-- Dependencies: 232
-- Data for Name: email_verifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_verifications (id, user_id, code_hash, sent_to_email, expires_at, consumed_at, created_at) FROM stdin;
\.


--
-- TOC entry 5056 (class 0 OID 149196)
-- Dependencies: 221
-- Data for Name: image_model; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.image_model (id, model_type, endpoint_id, prompt, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5069 (class 0 OID 149305)
-- Dependencies: 234
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.media (id, user_id, media_type, s3_url, coins_consumed, created_at) FROM stdin;
\.


--
-- TOC entry 5071 (class 0 OID 149322)
-- Dependencies: 236
-- Data for Name: oauth_identities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.oauth_identities (id, user_id, provider, provider_user_id, email, full_name, avatar_url) FROM stdin;
\.


--
-- TOC entry 5072 (class 0 OID 149335)
-- Dependencies: 237
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_resets (id, user_id, code_hash, expires_at, consumed_at, created_at) FROM stdin;
\.


--
-- TOC entry 5058 (class 0 OID 149208)
-- Dependencies: 223
-- Data for Name: pricing_plan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pricing_plan (plan_id, plan_name, pricing_id, currency, price, discount, billing_cycle, coin_reward, status, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5060 (class 0 OID 149221)
-- Dependencies: 225
-- Data for Name: promo_management; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_management (promo_id, promo_name, coupon, percent_off, start_date, expiry_date, status, applied_count, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5074 (class 0 OID 149349)
-- Dependencies: 239
-- Data for Name: promo_redemption; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.promo_redemption (redemption_id, promo_id, promo_code, user_id, order_id, applied_at, discount_applied, subtotal_at_apply, currency) FROM stdin;
\.


--
-- TOC entry 5075 (class 0 OID 149371)
-- Dependencies: 240
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.refresh_tokens (id, user_id, token_hash, user_agent, ip_address, expires_at, created_at) FROM stdin;
581e1f6e-8b98-4432-9ecd-7dcc2aceed8e	1	$2b$12$ALIL6SKnKW/AF3kn1ybAfePJlYVeJU89K6PaeOPs11xtRe/q1lOPq	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	127.0.0.1	2025-09-25 12:37:16.753036+05:30	2025-08-26 12:37:16.242272+05:30
bfdb21dd-6848-4818-ad8d-ffa3de6f5a89	1	$2b$12$GCryDk0mOKvbqQXH74vts.Rd52GfRMDzhCtKFUo/3CwyEFJlPwSwC	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	127.0.0.1	2025-09-25 13:06:08.636928+05:30	2025-08-26 13:06:07.631305+05:30
c9254e13-57c2-42cd-982a-723b621dc3a9	1	$2b$12$Z1I1eNM4bJu5ZkjNKGTXtOPN78VPBlTvTO35e5onMPSed.Tu/C6tG	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	127.0.0.1	2025-09-25 14:37:03.61706+05:30	2025-08-26 14:37:02.746636+05:30
e187e40f-32d2-4065-a8d0-57c907b88f94	1	$2b$12$1irdj4tr9SbgWHyb3TESxeFzjckG/Xz.TbuPsU83avClC75tcqvNC	PostmanRuntime/7.45.0	127.0.0.1	2025-09-25 14:56:15.121409+05:30	2025-08-26 14:56:14.33831+05:30
62719d3f-f7f1-4faf-831a-1e7a1e7e70a7	1	$2b$12$gCqjRxaLpRJ/.0bvFpb40OagdB7QsLJHTm33UrpTZlvQ7Xpv708tW	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	127.0.0.1	2025-09-25 18:13:54.057014+05:30	2025-08-26 18:13:53.018577+05:30
61794ee6-75b9-4932-b269-6e3d89031892	1	$2b$12$2xV5nBZvNek9w6vIxxK75.g4VgGSZlsViQT6Ehdo0AbLe1yMSphai	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	127.0.0.1	2025-09-25 18:26:03.215941+05:30	2025-08-26 18:26:02.287763+05:30
\.


--
-- TOC entry 5062 (class 0 OID 149244)
-- Dependencies: 227
-- Data for Name: speech_model; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.speech_model (id, model_type, endpoint_id, prompt, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5077 (class 0 OID 149385)
-- Dependencies: 242
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subscriptions (id, user_id, payment_customer_id, payment_subscription_id, price_id, plan_name, status, current_period_end, start_date, cancel_at_period_end, last_rewarded_period_end, total_coins_rewarded, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5091 (class 0 OID 149519)
-- Dependencies: 256
-- Data for Name: usage_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usage_metrics (id, user_id, character_id, tokens_input, tokens_output, "timestamp") FROM stdin;
\.


--
-- TOC entry 5079 (class 0 OID 149402)
-- Dependencies: 244
-- Data for Name: user_activations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_activations (id, user_id, token_hash, created_at, expires_at, consumed_at) FROM stdin;
\.


--
-- TOC entry 5081 (class 0 OID 149418)
-- Dependencies: 246
-- Data for Name: user_wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_wallets (id, user_id, coin_balance, updated_at) FROM stdin;
\.


--
-- TOC entry 5064 (class 0 OID 149262)
-- Dependencies: 229
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, hashed_password, full_name, role, is_active, is_email_verified, payment_customer_id, created_at, updated_at) FROM stdin;
1	admin@tripleminds.com	$2b$12$pg8JcLAhwqJQFAFvxHKWtu.GemTRx3p4fJ6Tomdb3Ox/ys4Ym.xhG	\N	ADMIN	t	t	\N	2025-08-26 11:13:10.457672+05:30	2025-08-26 11:13:10.457672+05:30
\.


--
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 216
-- Name: app_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.app_config_id_seq', 28, true);


--
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 247
-- Name: character_images_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.character_images_id_seq', 1, false);


--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 249
-- Name: character_video_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.character_video_id_seq', 1, false);


--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 230
-- Name: characters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.characters_id_seq', 1, true);


--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 251
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 1, false);


--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 218
-- Name: chat_model_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_model_id_seq', 1, false);


--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 253
-- Name: coin_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.coin_transactions_id_seq', 1, false);


--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 220
-- Name: image_model_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.image_model_id_seq', 1, false);


--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 233
-- Name: media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.media_id_seq', 1, false);


--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 235
-- Name: oauth_identities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.oauth_identities_id_seq', 1, false);


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 222
-- Name: pricing_plan_plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pricing_plan_plan_id_seq', 1, false);


--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 224
-- Name: promo_management_promo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_management_promo_id_seq', 1, false);


--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 238
-- Name: promo_redemption_redemption_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.promo_redemption_redemption_id_seq', 1, false);


--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 226
-- Name: speech_model_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.speech_model_id_seq', 1, false);


--
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 241
-- Name: subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subscriptions_id_seq', 1, false);


--
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 255
-- Name: usage_metrics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usage_metrics_id_seq', 1, false);


--
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 243
-- Name: user_activations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_activations_id_seq', 1, false);


--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 245
-- Name: user_wallets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_wallets_id_seq', 1, false);


--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 228
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- TOC entry 4811 (class 2606 OID 149134)
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- TOC entry 4813 (class 2606 OID 149161)
-- Name: app_config app_config_parameter_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_config
    ADD CONSTRAINT app_config_parameter_name_key UNIQUE (parameter_name);


--
-- TOC entry 4815 (class 2606 OID 149159)
-- Name: app_config app_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_config
    ADD CONSTRAINT app_config_pkey PRIMARY KEY (id);


--
-- TOC entry 4868 (class 2606 OID 149440)
-- Name: character_images character_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_images
    ADD CONSTRAINT character_images_pkey PRIMARY KEY (id);


--
-- TOC entry 4870 (class 2606 OID 149442)
-- Name: character_images character_images_s3_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_images
    ADD CONSTRAINT character_images_s3_path_key UNIQUE (s3_path);


--
-- TOC entry 4872 (class 2606 OID 149461)
-- Name: character_video character_video_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_video
    ADD CONSTRAINT character_video_pkey PRIMARY KEY (id);


--
-- TOC entry 4874 (class 2606 OID 149463)
-- Name: character_video character_video_s3_path_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_video
    ADD CONSTRAINT character_video_s3_path_key UNIQUE (s3_path);


--
-- TOC entry 4840 (class 2606 OID 149284)
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- TOC entry 4876 (class 2606 OID 149483)
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4818 (class 2606 OID 149187)
-- Name: chat_model chat_model_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_model
    ADD CONSTRAINT chat_model_pkey PRIMARY KEY (id);


--
-- TOC entry 4881 (class 2606 OID 149506)
-- Name: coin_transactions coin_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coin_transactions
    ADD CONSTRAINT coin_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4843 (class 2606 OID 149298)
-- Name: email_verifications email_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4821 (class 2606 OID 149205)
-- Name: image_model image_model_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.image_model
    ADD CONSTRAINT image_model_pkey PRIMARY KEY (id);


--
-- TOC entry 4846 (class 2606 OID 149314)
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- TOC entry 4848 (class 2606 OID 149329)
-- Name: oauth_identities oauth_identities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_identities
    ADD CONSTRAINT oauth_identities_pkey PRIMARY KEY (id);


--
-- TOC entry 4850 (class 2606 OID 149342)
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- TOC entry 4825 (class 2606 OID 149218)
-- Name: pricing_plan pricing_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pricing_plan
    ADD CONSTRAINT pricing_plan_pkey PRIMARY KEY (plan_id);


--
-- TOC entry 4828 (class 2606 OID 149235)
-- Name: promo_management promo_management_coupon_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_management
    ADD CONSTRAINT promo_management_coupon_key UNIQUE (coupon);


--
-- TOC entry 4830 (class 2606 OID 149233)
-- Name: promo_management promo_management_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_management
    ADD CONSTRAINT promo_management_pkey PRIMARY KEY (promo_id);


--
-- TOC entry 4853 (class 2606 OID 149359)
-- Name: promo_redemption promo_redemption_order_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_redemption
    ADD CONSTRAINT promo_redemption_order_id_key UNIQUE (order_id);


--
-- TOC entry 4855 (class 2606 OID 149357)
-- Name: promo_redemption promo_redemption_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_redemption
    ADD CONSTRAINT promo_redemption_pkey PRIMARY KEY (redemption_id);


--
-- TOC entry 4857 (class 2606 OID 149378)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 4833 (class 2606 OID 149253)
-- Name: speech_model speech_model_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.speech_model
    ADD CONSTRAINT speech_model_pkey PRIMARY KEY (id);


--
-- TOC entry 4860 (class 2606 OID 149394)
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 4885 (class 2606 OID 149524)
-- Name: usage_metrics usage_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_metrics
    ADD CONSTRAINT usage_metrics_pkey PRIMARY KEY (id);


--
-- TOC entry 4863 (class 2606 OID 149410)
-- Name: user_activations user_activations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activations
    ADD CONSTRAINT user_activations_pkey PRIMARY KEY (id);


--
-- TOC entry 4866 (class 2606 OID 149425)
-- Name: user_wallets user_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_pkey PRIMARY KEY (id);


--
-- TOC entry 4836 (class 2606 OID 149273)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4838 (class 2606 OID 149271)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4816 (class 1259 OID 149162)
-- Name: ix_app_config_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_app_config_id ON public.app_config USING btree (id);


--
-- TOC entry 4841 (class 1259 OID 149290)
-- Name: ix_characters_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_characters_id ON public.characters USING btree (id);


--
-- TOC entry 4877 (class 1259 OID 149494)
-- Name: ix_chat_messages_character_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_chat_messages_character_id ON public.chat_messages USING btree (character_id);


--
-- TOC entry 4878 (class 1259 OID 149495)
-- Name: ix_chat_messages_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_chat_messages_session_id ON public.chat_messages USING btree (session_id);


--
-- TOC entry 4879 (class 1259 OID 149496)
-- Name: ix_chat_messages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_chat_messages_user_id ON public.chat_messages USING btree (user_id);


--
-- TOC entry 4819 (class 1259 OID 149188)
-- Name: ix_chat_model_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_chat_model_id ON public.chat_model USING btree (id);


--
-- TOC entry 4882 (class 1259 OID 149517)
-- Name: ix_coin_transactions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_coin_transactions_id ON public.coin_transactions USING btree (id);


--
-- TOC entry 4822 (class 1259 OID 149206)
-- Name: ix_image_model_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_image_model_id ON public.image_model USING btree (id);


--
-- TOC entry 4844 (class 1259 OID 149320)
-- Name: ix_media_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_media_id ON public.media USING btree (id);


--
-- TOC entry 4823 (class 1259 OID 149219)
-- Name: ix_pricing_plan_plan_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_pricing_plan_plan_id ON public.pricing_plan USING btree (plan_id);


--
-- TOC entry 4826 (class 1259 OID 149236)
-- Name: ix_promo_management_promo_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_promo_management_promo_id ON public.promo_management USING btree (promo_id);


--
-- TOC entry 4851 (class 1259 OID 149370)
-- Name: ix_promo_redemption_redemption_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_promo_redemption_redemption_id ON public.promo_redemption USING btree (redemption_id);


--
-- TOC entry 4831 (class 1259 OID 149254)
-- Name: ix_speech_model_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_speech_model_id ON public.speech_model USING btree (id);


--
-- TOC entry 4858 (class 1259 OID 149400)
-- Name: ix_subscriptions_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_subscriptions_id ON public.subscriptions USING btree (id);


--
-- TOC entry 4883 (class 1259 OID 149535)
-- Name: ix_usage_metrics_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_usage_metrics_id ON public.usage_metrics USING btree (id);


--
-- TOC entry 4861 (class 1259 OID 149416)
-- Name: ix_user_activations_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_activations_id ON public.user_activations USING btree (id);


--
-- TOC entry 4864 (class 1259 OID 149431)
-- Name: ix_user_wallets_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_user_wallets_id ON public.user_wallets USING btree (id);


--
-- TOC entry 4834 (class 1259 OID 149274)
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- TOC entry 4897 (class 2606 OID 149443)
-- Name: character_images character_images_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_images
    ADD CONSTRAINT character_images_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- TOC entry 4898 (class 2606 OID 149448)
-- Name: character_images character_images_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_images
    ADD CONSTRAINT character_images_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4899 (class 2606 OID 149464)
-- Name: character_video character_video_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_video
    ADD CONSTRAINT character_video_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- TOC entry 4900 (class 2606 OID 149469)
-- Name: character_video character_video_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.character_video
    ADD CONSTRAINT character_video_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4886 (class 2606 OID 149285)
-- Name: characters characters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4901 (class 2606 OID 149484)
-- Name: chat_messages chat_messages_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id);


--
-- TOC entry 4902 (class 2606 OID 149489)
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4903 (class 2606 OID 149507)
-- Name: coin_transactions coin_transactions_subscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coin_transactions
    ADD CONSTRAINT coin_transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES public.subscriptions(id);


--
-- TOC entry 4904 (class 2606 OID 149512)
-- Name: coin_transactions coin_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.coin_transactions
    ADD CONSTRAINT coin_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4887 (class 2606 OID 149299)
-- Name: email_verifications email_verifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_verifications
    ADD CONSTRAINT email_verifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4888 (class 2606 OID 149315)
-- Name: media media_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4889 (class 2606 OID 149330)
-- Name: oauth_identities oauth_identities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oauth_identities
    ADD CONSTRAINT oauth_identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4890 (class 2606 OID 149343)
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4891 (class 2606 OID 149360)
-- Name: promo_redemption promo_redemption_promo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_redemption
    ADD CONSTRAINT promo_redemption_promo_id_fkey FOREIGN KEY (promo_id) REFERENCES public.promo_management(promo_id) ON DELETE RESTRICT;


--
-- TOC entry 4892 (class 2606 OID 149365)
-- Name: promo_redemption promo_redemption_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promo_redemption
    ADD CONSTRAINT promo_redemption_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4893 (class 2606 OID 149379)
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4894 (class 2606 OID 149395)
-- Name: subscriptions subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4905 (class 2606 OID 149525)
-- Name: usage_metrics usage_metrics_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_metrics
    ADD CONSTRAINT usage_metrics_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id);


--
-- TOC entry 4906 (class 2606 OID 149530)
-- Name: usage_metrics usage_metrics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usage_metrics
    ADD CONSTRAINT usage_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4895 (class 2606 OID 149411)
-- Name: user_activations user_activations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activations
    ADD CONSTRAINT user_activations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4896 (class 2606 OID 149426)
-- Name: user_wallets user_wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_wallets
    ADD CONSTRAINT user_wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2025-08-26 20:38:15

--
-- PostgreSQL database dump complete
--

