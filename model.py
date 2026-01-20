##
====================== model.py==================

# ============================================================================
# ID Generator (simplified for consolidation)
# ============================================================================

def generate_id():
    """Generate a unique 32-character ID"""
    return uuid.uuid4().hex


# ============================================================================
# User Models
# ============================================================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    email = Column(Text, unique=True, nullable=False)
    hashed_password = Column(Text, nullable=True)  # nullable for SSO
    full_name = Column(Text, nullable=True)
    role = Column(
        PgEnum(RoleEnum, name="role_enum", create_constraint=True),
        nullable=False,
        default=RoleEnum.USER,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    is_email_verified = Column(Boolean, default=False, nullable=False)
    payment_customer_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    activation_tokens = relationship("UserActivation", back_populates="user", cascade="all, delete-orphan")
    coin_transactions = relationship("CoinTransaction", back_populates="user")
    character_media = relationship("CharacterMedia", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    order = relationship("Order", back_populates="user")
    user_wallet = relationship("UserWallet", back_populates="user")
    subscription = relationship("Subscription", back_populates="user")


class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(Text, nullable=True)
    email_id = Column(Text, nullable=True)
    username = Column(String(150), nullable=True, unique=False)
    gender = Column(String(32), nullable=True)
    birth_date = Column(Date, nullable=True)
    profile_image_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    user = relationship("User", back_populates="profile")


class UserActivation(Base):
    __tablename__ = "user_activations"
    
    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    consumed_at = Column(DateTime(timezone=True))
    
    user = relationship("User", back_populates="activation_tokens")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String, nullable=False)
    user_agent = Column(String)
    ip_address = Column(INET)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class EmailVerification(Base):
    __tablename__ = "email_verifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code_hash = Column(String, nullable=False)
    sent_to_email = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    consumed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class PasswordReset(Base):
    __tablename__ = "password_resets"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code_hash = Column(String, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    consumed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class OAuthIdentity(Base):
    __tablename__ = "oauth_identities"
    
    id = Column(String(32), primary_key=True, default=generate_id)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String, nullable=False)
    provider_user_id = Column(String, nullable=False)
    email = Column(String)
    full_name = Column(String)
    avatar_url = Column(String)


# ============================================================================
# Character Models
# ============================================================================

class Character(Base):
    __tablename__ = "characters"
    
    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    username = Column(String(255), nullable=False)
    bio = Column(Text)
    user_id = Column(String(32), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    gender = Column(String(255), nullable=False, default="Girl")
    style = Column(String(255))
    ethnicity = Column(String(255))
    age = Column(Integer)
    eye_colour = Column(String(255))
    hair_style = Column(String(255))
    hair_colour = Column(String(255))
    body_type = Column(String(255))
    breast_size = Column(String(255))
    butt_size = Column(String(255))
    dick_size = Column(String(255))
    personality = Column(Text)
    voice_type = Column(String(255))
    relationship_type = Column(String(255))
    clothing = Column(String(255))
    special_features = Column(Text)
    prompt = Column(Text, nullable=False)
    image_url_s3 = Column(Text)
    privacy = Column(String(255), default="private")
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    character_media = relationship("CharacterMedia", back_populates="character", cascade="all, delete-orphan", passive_deletes=True)


class CharacterStats(Base):
    __tablename__ = "character_stats"
    
    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    character_id = Column(String(32), ForeignKey("characters.id"), nullable=False)
    user_id = Column(String(32), ForeignKey("users.id"), nullable=False)
    liked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc), nullable=False)


class CharacterMedia(Base):
    __tablename__ = "character_media"
    
    id = Column(String(32), primary_key=True, default=generate_id)
    character_id = Column(String(32), ForeignKey("characters.id", ondelete="CASCADE"), nullable=True)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"))
    media_type = Column(String, nullable=False, default="image")
    s3_path = Column(Text, unique=True, nullable=False)
    mime_type = Column(String, nullable=False, default="image/png")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)

    # Relationships
    character = relationship("Character", back_populates="character_media")
    user = relationship("User", back_populates="character_media", passive_deletes=True)


# ============================================================================
# Chat Models
# ============================================================================

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String(32), primary_key=True, default=generate_id)
    session_id = Column(String(64), nullable=False, index=True)
    user_id = Column(String(32), ForeignKey("users.id"), nullable=False, index=True)
    character_id = Column(String(32), ForeignKey("characters.id"), nullable=False, index=True)
    user_query = Column(Text, nullable=False)
    ai_message = Column(Text, nullable=True)
    context_window = Column(Integer, nullable=True)
    is_media_available = Column(Boolean, default=False)
    media_type = Column(String(250), nullable=True)
    s3_url_media = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ChatModel(Base):
    __tablename__ = "chat_model"

    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    model_type = Column(PgEnum(ModelType, name="chat_model_type", values_callable=lambda x: [e.value for e in x]), nullable=False)
    endpoint_id = Column(String, nullable=False)
    chat_tone = Column(PgEnum(ChatTone, name="chat_tone_enum", values_callable=lambda x: [e.value for e in x]), nullable=False)
    prompt_standard = Column(Text, nullable=True)
    prompt_nsfw = Column(Text, nullable=True)
    prompt_ultra_nsfw = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# ============================================================================
# Subscription & Payment Models
# ============================================================================

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    user_id = Column(String(32), ForeignKey("users.id"), nullable=False)
    payment_customer_id = Column(String, nullable=False)
    subscription_id = Column(String, nullable=True, unique=True)
    order_id = Column(String(32), ForeignKey("orders.id"), nullable=True)
    price_id = Column(String, nullable=True)
    plan_name = Column(String, nullable=True)
    status = Column(String, nullable=False)
    current_period_end = Column(DateTime)
    start_date = Column(DateTime, default=func.now())
    cancel_at_period_end = Column(Boolean, default=False)
    last_rewarded_period_end = Column(DateTime, nullable=True)
    total_coins_rewarded = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="subscription")


class PromoManagement(Base):
    __tablename__ = "promo_management"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    promo_name = Column(String(255), nullable=False)
    discount_type = Column(String(50), nullable=False)
    coupon = Column(String(100), nullable=False, unique=True)
    currency = Column(String(3), nullable=False, server_default='USD')
    percent_off = Column(Numeric(5, 2), nullable=False)
    start_date = Column(DateTime(timezone=True), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), nullable=False, server_default='active')
    applied_count = Column(Integer, nullable=False, server_default='0')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    orders = relationship("Order", back_populates="promo_management")
    
    __table_args__ = (
        CheckConstraint('coupon = UPPER(coupon)', name='chk_coupon_upper'),
        CheckConstraint('percent_off >= 0 AND percent_off <= 100', name='chk_percent_range'),
        CheckConstraint('expiry_date IS NULL OR start_date IS NULL OR start_date <= expiry_date', name='chk_dates_order'),
    )


class PricingPlan(Base):
    __tablename__ = "pricing_plan"
    
    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    plan_name = Column(String(255), nullable=False)
    pricing_id = Column(String(255), nullable=False)
    coupon = Column(String(255), nullable=False)
    currency = Column(CHAR(3), nullable=False, server_default='USD')
    price = Column(Numeric(10, 2), nullable=False)
    discount = Column(Numeric(10, 2), nullable=True)
    billing_cycle = Column(String(50), nullable=False)
    coin_reward = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    promo_id = Column(BigInteger, ForeignKey("promo_management.id", ondelete="RESTRICT"), nullable=True)
    promo_code = Column(String(100), nullable=True)
    user_id = Column(String(32), ForeignKey("users.id"), nullable=False)
    telegram_username = Column(String(255), nullable=True)
    pricing_id = Column(String(255), ForeignKey("pricing_plan.pricing_id", ondelete="RESTRICT"), nullable=True)
    provider = Column(String(50), nullable=True)
    provider_order_ref = Column(String(150), nullable=True)
    provider_txid_in = Column(String(150), nullable=True)
    provider_txid_out = Column(String(150), nullable=True)
    provider_coin = Column(String(50), nullable=True)
    paid_value_coin = Column(Numeric(18, 6), nullable=True)
    discount_type = Column(String(100), nullable=True)
    discount_applied = Column(Numeric(10, 2), server_default="0", nullable=False)
    subtotal_at_apply = Column(Numeric(10, 2), nullable=False)
    currency = Column(CHAR(3), nullable=False, server_default="USD")
    status = Column(String(20), nullable=False, server_default="pending")
    paygate_ipn_token = Column(Text, nullable=True)
    paygate_address_in = Column(Text, nullable=True)
    applied_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    promo_management = relationship("PromoManagement", back_populates="orders")
    user = relationship("User", back_populates="order")


class UserWallet(Base):
    __tablename__ = "user_wallets"
    
    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    coin_balance = Column(Integer, nullable=False, server_default='0')
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    user = relationship("User", back_populates="user_wallet")
    
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_wallets_user_id"),
    )


class CoinTransaction(Base):
    __tablename__ = "coin_transactions"

    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    character_id = Column(String(32), ForeignKey("characters.id", ondelete="SET NULL"), nullable=True)
    transaction_type = Column(String(50), nullable=False)
    coins = Column(Integer, nullable=False)
    source_type = Column(String(50), nullable=False)
    order_id = Column(String(32), ForeignKey("orders.id"), nullable=True)
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    user = relationship("User")


# ============================================================================
# Media Models
# ============================================================================

class Media(Base):
    __tablename__ = "media"

    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    media_type = Column(String(50), nullable=False)
    s3_url = Column(Text, nullable=True)
    coins_consumed = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User")

    __table_args__ = (
        CheckConstraint("media_type IN ('image','video','character')", name='chk_media_type'),
    )


class ImageModel(Base):
    __tablename__ = "image_model"
    
    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    model_type = Column(PgEnum(ImageModelType, name="image_model_type_enum", values_callable=lambda x: [e.value for e in x]), nullable=False)
    endpoint_id = Column(String, nullable=False)
    prompt = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# ============================================================================
# AI Editor & Story Models
# ============================================================================

class AiEditor(Base):
    __tablename__ = "ai_editor"
    
    id = Column(String(32), primary_key=True, default=generate_id)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"))
    image_gen_id = Column(String, nullable=False)
    mime_type = Column(String, nullable=True, default="image/png")
    media_type = Column(String, nullable=False)
    s3_path_image_gen = Column(Text, nullable=True)
    s3_path_source_image = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)


class AiStory(Base):
    __tablename__ = "ai_story"
    
    id = Column(String(32), primary_key=True, default=generate_id)
    user_id = Column(String(32), ForeignKey("users.id", ondelete="CASCADE"))
    user_prompt = Column(Text, nullable=False)
    title = Column(Text, nullable=True)
    story = Column(Text, nullable=True)
    read_count = Column(Integer, nullable=False, default=0)
    likes_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.datetime.now(datetime.timezone.utc), nullable=False)


class StoryStats(Base):
    __tablename__ = "story_stats"
    
    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    story_id = Column(String(32), ForeignKey("ai_story.id"), nullable=False)
    user_id = Column(String(32), ForeignKey("users.id"), nullable=False)
    liked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc), nullable=False)


# ============================================================================
# Speech Model
# ============================================================================

class SpeechModel(Base):
    __tablename__ = "speech_model"

    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    model_type = Column(PgEnum(SpeechModelType, name="speech_model_type_enum", values_callable=lambda x: [e.value for e in x]), nullable=False)
    endpoint_id = Column(String, nullable=False)
    prompt = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


# ============================================================================
# Usage Metrics
# ============================================================================

class UsageMetrics(Base):
    __tablename__ = "usage_metrics"
    
    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    user_id = Column(String(32), ForeignKey("users.id"), nullable=False)
    character_id = Column(String(32), ForeignKey("characters.id"), nullable=False)
    tokens_input = Column(Integer, default=0)
    tokens_output = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


# ============================================================================
# App Configuration
# ============================================================================

class AppConfig(Base):
    __tablename__ = "app_config"

    id = Column(String(32), primary_key=True, index=True, default=generate_id)
    category = Column(Text, nullable=False)
    parameter_name = Column(String, unique=True, nullable=False)
    parameter_value = Column(Text, nullable=False)
    parameter_description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def as_dict(self):
        """Convert the model instance to a dictionary"""
        return {
            'id': self.id,
            'category': self.category.value if self.category else None,
            'parameter_name': self.parameter_name,
            'parameter_value': self.parameter_value,
            'parameter_description': self.parameter_description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }





