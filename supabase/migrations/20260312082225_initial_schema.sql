-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES (mirrors auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  role          TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
  preferences   JSONB DEFAULT '{}',
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AIRCRAFT
-- ============================================================
CREATE TABLE public.aircraft (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model         TEXT NOT NULL,
  registration  TEXT UNIQUE NOT NULL,
  seat_capacity INT NOT NULL CHECK (seat_capacity > 0),
  range_km      INT,
  features      JSONB DEFAULT '[]',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROUTES
-- ============================================================
CREATE TABLE public.routes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin        TEXT NOT NULL,
  destination   TEXT NOT NULL,
  distance_km   INT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(origin, destination)
);

-- ============================================================
-- SCHEDULES
-- ============================================================
CREATE TABLE public.schedules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id        UUID NOT NULL REFERENCES public.routes(id),
  aircraft_id     UUID NOT NULL REFERENCES public.aircraft(id),
  departure_time  TIMESTAMPTZ NOT NULL,
  arrival_time    TIMESTAMPTZ NOT NULL,
  price           NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  available_seats INT NOT NULL CHECK (available_seats >= 0),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE public.bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id),
  schedule_id         UUID NOT NULL REFERENCES public.schedules(id),
  booking_reference   TEXT UNIQUE NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'confirmed', 'cancelled', 'failed', 'refunded')),
  total_price         NUMERIC(12, 2) NOT NULL,
  passenger_count     INT NOT NULL DEFAULT 1,
  cancelled_at        TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKING PASSENGERS
-- ============================================================
CREATE TABLE public.booking_passengers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  passport_number TEXT,
  seat_number     TEXT,
  date_of_birth   DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE public.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          UUID NOT NULL REFERENCES public.bookings(id),
  paystack_reference  TEXT UNIQUE NOT NULL,
  amount              NUMERIC(12, 2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'NGN',
  status              TEXT NOT NULL DEFAULT 'initialized'
                      CHECK (status IN ('initialized', 'pending', 'success', 'failed', 'reversed')),
  paystack_response   JSONB,
  ip_address          INET,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKING DOCUMENTS
-- ============================================================
CREATE TABLE public.booking_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID NOT NULL REFERENCES public.bookings(id),
  document_type TEXT NOT NULL CHECK (document_type IN ('receipt', 'itinerary')),
  storage_path  TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EMAIL LOGS (append-only)
-- ============================================================
CREATE TABLE public.email_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID REFERENCES public.bookings(id),
  recipient     TEXT NOT NULL,
  email_type    TEXT NOT NULL CHECK (email_type IN ('confirmation', 'receipt', 'cancellation', 'reminder')),
  status        TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  resend_id     TEXT,
  error_message TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ADMIN USERS
-- ============================================================
CREATE TABLE public.admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES auth.users(id),
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS (append-only)
-- ============================================================
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL,
  admin_id    UUID REFERENCES auth.users(id),
  target_id   UUID,
  target_type TEXT,
  metadata    JSONB DEFAULT '{}',
  ip_address  INET,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_role                 ON public.profiles(role);

CREATE INDEX idx_schedules_route_id            ON public.schedules(route_id);
CREATE INDEX idx_schedules_departure_time      ON public.schedules(departure_time);
CREATE INDEX idx_schedules_status              ON public.schedules(status);
CREATE INDEX idx_schedules_route_departure     ON public.schedules(route_id, departure_time);

CREATE INDEX idx_bookings_user_id              ON public.bookings(user_id);
CREATE INDEX idx_bookings_status               ON public.bookings(status);
CREATE INDEX idx_bookings_reference            ON public.bookings(booking_reference);
CREATE INDEX idx_bookings_schedule_id          ON public.bookings(schedule_id);
CREATE INDEX idx_bookings_created_at           ON public.bookings(created_at DESC);
CREATE INDEX idx_bookings_ref_status           ON public.bookings(booking_reference, status);

CREATE INDEX idx_booking_passengers_booking_id ON public.booking_passengers(booking_id);

CREATE INDEX idx_payments_booking_id           ON public.payments(booking_id);
CREATE INDEX idx_payments_status               ON public.payments(status);
CREATE INDEX idx_payments_reference            ON public.payments(paystack_reference);
CREATE INDEX idx_payments_created_at           ON public.payments(created_at DESC);

CREATE INDEX idx_booking_documents_booking_id  ON public.booking_documents(booking_id);
CREATE INDEX idx_booking_documents_type        ON public.booking_documents(booking_id, document_type);

CREATE INDEX idx_email_logs_booking_id         ON public.email_logs(booking_id);
CREATE INDEX idx_email_logs_status             ON public.email_logs(status);

CREATE INDEX idx_audit_logs_admin_id           ON public.audit_logs(admin_id);
CREATE INDEX idx_audit_logs_timestamp          ON public.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_target             ON public.audit_logs(target_id, target_type);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aircraft           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_documents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- AIRCRAFT / ROUTES / SCHEDULES — public read
CREATE POLICY "Anyone can view active aircraft"
  ON public.aircraft FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active routes"
  ON public.routes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view active schedules"
  ON public.schedules FOR SELECT
  USING (status = 'active');

-- BOOKINGS — owners only
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

-- BOOKING PASSENGERS
CREATE POLICY "Users can view passengers of own bookings"
  ON public.booking_passengers FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

-- PAYMENTS
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

-- BOOKING DOCUMENTS
CREATE POLICY "Users can view own booking documents"
  ON public.booking_documents FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

-- email_logs, admin_users, audit_logs: service role only — no client policies

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
