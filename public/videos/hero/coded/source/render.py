import cairo, math, os, sys

W, H = 1280, 720
FPS = 24
FLOOR = 600
T_INTRO = 13.5
LOOP = 8.0

THEME_TEAL = (0.18, 0.83, 0.75)
THEME_BLUE = (0.23, 0.51, 0.96)
THEME_VIOLET = (0.55, 0.36, 0.96)

SKIN = (0.74, 0.53, 0.40)
SKIN_SHADE = (0.60, 0.41, 0.31)
HAIR = (0.08, 0.07, 0.09)
HOODIE = (0.22, 0.27, 0.37)
HOODIE_BACK = (0.14, 0.17, 0.25)
PANTS = (0.10, 0.12, 0.17)
PANTS_BACK = (0.07, 0.08, 0.12)
SHOE = (0.85, 0.87, 0.92)
SHOE_BACK = (0.62, 0.65, 0.72)

THIGH, SHIN = 56, 54
TORSO = 76
UPPER_ARM, FOREARM = 42, 40


def clamp(v, a=0.0, b=1.0):
    return max(a, min(b, v))


def smooth(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def limb(origin, angle_deg, length):
    a = math.radians(angle_deg)
    return (origin[0] + math.sin(a) * length, origin[1] + math.cos(a) * length)


def up(origin, angle_deg, length):
    a = math.radians(angle_deg)
    return (origin[0] + math.sin(a) * length, origin[1] - math.cos(a) * length)


def ik(shoulder, target, l1, l2):
    dx, dy = target[0] - shoulder[0], target[1] - shoulder[1]
    d = math.hypot(dx, dy)
    d = clamp(d, abs(l1 - l2) + 0.01, l1 + l2 - 0.01)
    base = math.atan2(dy, dx)
    cos_a = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
    a = math.acos(clamp(cos_a, -1, 1))
    best = None
    for s in (1, -1):
        ang = base + s * a
        elbow = (shoulder[0] + math.cos(ang) * l1, shoulder[1] + math.sin(ang) * l1)
        score = elbow[1] - 0.15 * elbow[0]
        if best is None or score > best[0]:
            best = (score, elbow)
    elbow = best[1]
    ex, ey = target[0] - elbow[0], target[1] - elbow[1]
    el = math.hypot(ex, ey) or 1
    hand = (elbow[0] + ex / el * l2, elbow[1] + ey / el * l2)
    return elbow, hand


KEYS = {}


def key(name, *pairs):
    KEYS[name] = list(pairs)


def val(name, t):
    ks = KEYS[name]
    if t <= ks[0][0]:
        return ks[0][1]
    for (t0, v0), (t1, v1) in zip(ks, ks[1:]):
        if t0 <= t <= t1:
            s = smooth((t - t0) / (t1 - t0)) if t1 > t0 else 1
            if isinstance(v0, tuple):
                return tuple(lerp(a, b, s) for a, b in zip(v0, v1))
            return lerp(v0, v1, s)
    return ks[-1][1]


GLASSES_SPOT = (632, 466)
MUG_SPOT = (668, 459)
DESK_MUG = (914, 481)
KEYBOARD = (948, 486)

key("hx", (0, 238), (1.6, 238), (2.8, 338), (3.4, 338), (4.2, 380), (5.4, 380), (7.0, 548), (9.2, 548), (11.6, 866))
key("hy", (0, 534), (1.6, 534), (2.8, 540), (3.4, 540), (4.2, 490), (11.6, 490), (12.4, 530))
key("torso", (0, -90), (1.6, -90), (2.8, 2), (3.4, 4), (3.8, 18), (4.2, 3), (5.4, 3), (7.0, 6), (7.6, 18), (8.1, 2), (8.3, 2), (8.8, 16), (9.2, 5), (11.6, 5), (12.0, -4), (12.4, 14))
key("tilt", (0, 0), (1.6, 0), (2.4, -10), (2.8, 6), (3.4, 4), (4.2, 0), (7.0, 4), (7.6, 14), (8.1, 0), (8.8, 10), (9.2, 0), (12.4, 6))
key("fthigh", (0, 90), (2.0, 90), (2.8, 88), (3.4, 88), (4.2, 0), (11.6, 0), (12.4, 88))
key("fshin", (0, 90), (1.8, 90), (2.8, 2), (3.4, 4), (4.2, 0), (11.6, 0), (12.4, 4))
key("bthigh", (0, 92), (2.0, 92), (2.8, 84), (3.4, 84), (4.2, 0), (11.6, 0), (12.4, 84))
key("bshin", (0, 92), (1.8, 92), (2.8, -4), (3.4, -2), (4.2, 0), (11.6, 0), (12.4, -2))
key("walk", (0, 0), (5.4, 0), (5.7, 1), (6.7, 1), (7.0, 0), (9.2, 0), (9.5, 1), (11.3, 1), (11.6, 0))
key("eyes", (0, 0), (1.9, 0), (2.1, 1), (2.9, 1), (2.95, 0), (3.25, 0), (3.3, 1))

HANG = (6, 78)
key("farm", (0, (78, 4)), (1.6, (78, 4)), (2.8, (30, 64)), (2.95, "EYES"), (3.25, "EYES"), (3.4, (34, 62)), (4.2, HANG), (4.4, HANG), (4.8, (10, -80)), (5.1, (10, -80)), (5.5, HANG),
    (7.0, HANG), (7.6, "GLASSES"), (7.75, "GLASSES"), (8.15, "FACE"), (8.3, "FACE"), (8.8, "MUG"), (8.95, "MUG"), (9.3, (44, 2)), (11.6, (44, 2)),
    (12.4, (50, 6)), (12.8, "DESKMUG"), (13.0, "DESKMUG"), (13.5, "KEYS_F"))
key("barm", (0, (74, 8)), (1.6, (74, 8)), (2.8, (24, 66)), (3.4, (28, 64)), (4.2, HANG), (4.4, HANG), (4.8, (-6, -80)), (5.1, (-6, -80)), (5.5, HANG),
    (11.6, HANG), (12.4, (20, 70)), (13.0, (30, 66)), (13.5, "KEYS_B"))

GLASSES_PICK, GLASSES_ON = 7.75, 8.2
MUG_PICK, MUG_PLACE = 8.95, 13.0


def body_points(t):
    hx, hy = val("hx", t), val("hy", t)
    torso = val("torso", t)
    walk = val("walk", t)
    step = 74.0
    if t < 8:
        phase = math.pi * (hx - 380) / step
    else:
        phase = math.pi * (hx - 548) / step
    sw = 24 * walk
    s = math.sin(phase)
    bob = 3.5 * walk * abs(math.cos(phase))
    hy -= bob
    if t < 2.0 or t > 13.0:
        breathe = math.sin(2 * math.pi * t / 2.0) * 0.8
    else:
        breathe = 0
    hip = (hx, hy + breathe * 0.3)
    fth = val("fthigh", t) + sw * s
    bth = val("bthigh", t) - sw * s
    fsh = val("fshin", t) + sw * s - 34 * walk * max(0, -math.cos(phase)) * (1 if s < 0 else 0.4)
    bsh = val("bshin", t) - sw * s - 34 * walk * max(0, math.cos(phase)) * (1 if s > 0 else 0.4)
    if t < 2.0:
        fsh, bsh = val("fshin", t), val("bshin", t)
    lt = loop_t(t)
    extra_tilt = 0
    if lt >= 0:
        extra_tilt = 2.5 * math.sin(2 * math.pi * lt / 2.0)
        extra_tilt += -16 * (smooth((lt - 5.5) / 0.3) - smooth((lt - 6.2) / 0.3))
    neck = up(hip, torso, TORSO)
    shoulder = up(hip, torso, TORSO - 9)
    tilt = val("tilt", t) + extra_tilt
    head = up(neck, torso + tilt, 23)
    return dict(hip=hip, torso=torso, neck=neck, shoulder=shoulder, head=head, headang=torso + tilt,
                fth=fth, bth=bth, fsh=fsh, bsh=bsh, walk=walk, phase=phase)


def resolve_target(name, t, P):
    sh = P["shoulder"]
    if name == "GLASSES":
        return GLASSES_SPOT
    if name in ("EYES", "MOUTH"):
        hd = P["head"]
        a = math.radians(P["headang"])
        fx, fy = (13, -3) if name == "EYES" else (15, 11)
        return (hd[0] + math.cos(a) * fx - math.sin(a) * fy, hd[1] + math.sin(a) * fx + math.cos(a) * fy)
    if name == "FACE":
        hd = P["head"]
        a = math.radians(P["headang"])
        return (hd[0] + math.cos(a) * 14 + math.sin(a) * 4, hd[1] + math.sin(a) * 14 + 8)
    if name == "MUG":
        return MUG_SPOT
    if name == "DESKMUG":
        return DESK_MUG
    if name == "KEYS_F":
        return (KEYBOARD[0] + 8, KEYBOARD[1])
    if name == "KEYS_B":
        return (KEYBOARD[0] - 6, KEYBOARD[1] + 1)
    return (sh[0] + name[0], sh[1] + name[1])


def arm_target(arm, t, P):
    ks = KEYS[arm]
    if t <= ks[0][0]:
        return resolve_target(ks[0][1], t, P)
    for (t0, v0), (t1, v1) in zip(ks, ks[1:]):
        if t0 <= t <= t1:
            s = smooth((t - t0) / (t1 - t0)) if t1 > t0 else 1
            a = resolve_target(v0, t, P)
            b = resolve_target(v1, t, P)
            return (lerp(a[0], b[0], s), lerp(a[1], b[1], s))
    return resolve_target(ks[-1][1], t, P)


def typing_offset(t, which):
    if t < 13.5:
        ramp = smooth((t - 13.3) / 0.2)
    else:
        ramp = 1
    f = 3.0 if which == "f" else 2.5
    ph = 0 if which == "f" else 1.7
    return (0, -2.6 * ramp * max(0, math.sin(2 * math.pi * f * t + ph)))


SIP = [(4.3, "KEYS_F"), (4.9, "DESKMUG"), (5.05, "DESKMUG"), (5.6, "MOUTH"), (6.3, "MOUTH"), (6.9, "DESKMUG"), (7.05, "DESKMUG"), (7.6, "KEYS_F")]


def loop_t(t):
    return (t - T_INTRO) % LOOP if t >= T_INTRO else -1


def sip_target(t, P):
    lt = loop_t(t)
    if lt < SIP[0][0] or lt > SIP[-1][0]:
        return None
    for (t0, v0), (t1, v1) in zip(SIP, SIP[1:]):
        if t0 <= lt <= t1:
            s = smooth((lt - t0) / (t1 - t0))
            a, b = resolve_target(v0, t, P), resolve_target(v1, t, P)
            return (lerp(a[0], b[0], s), lerp(a[1], b[1], s))
    return None


def mug_in_hand_loop(t):
    lt = loop_t(t)
    return 5.0 <= lt < 7.0


def arms(t, P):
    sh = P["shoulder"]
    ft = arm_target("farm", t, P)
    st = sip_target(t, P)
    sipping = st is not None
    if sipping:
        ft = st
    bt = arm_target("barm", t, P)
    walk, phase = P["walk"], P["phase"]
    swing = 16 * walk * math.sin(phase)
    if not (8.9 < t < 12.9):
        ft = (ft[0] - swing, ft[1])
    bt = (bt[0] + swing, bt[1])
    ox, oy = typing_offset(t, "f")
    if not sipping:
        ft = (ft[0] + ox, ft[1] + oy)
    ox, oy = typing_offset(t, "b")
    bt = (bt[0] + ox, bt[1] + oy)
    back_sh = (sh[0] - 3, sh[1] + 1)
    fe, fh = ik(sh, ft, UPPER_ARM, FOREARM)
    be, bh = ik(back_sh, bt, UPPER_ARM, FOREARM)
    return dict(fe=fe, fh=fh, be=be, bh=bh, bsh=back_sh)


def stroke_line(cr, pts, width, color, alpha=1.0):
    cr.set_line_cap(cairo.LINE_CAP_ROUND)
    cr.set_line_join(cairo.LINE_JOIN_ROUND)
    cr.set_line_width(width)
    cr.set_source_rgba(*color, alpha)
    cr.move_to(*pts[0])
    for p in pts[1:]:
        cr.line_to(*p)
    cr.stroke()


def circle(cr, c, r, color, alpha=1.0):
    cr.arc(c[0], c[1], r, 0, 2 * math.pi)
    cr.set_source_rgba(*color, alpha)
    cr.fill()


def rrect(cr, x, y, w, h, r):
    cr.new_sub_path()
    cr.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    cr.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    cr.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    cr.arc(x + r, y + r, r, math.pi, 3 * math.pi / 2)
    cr.close_path()


def shoe(cr, ankle, shin_angle, color):
    a = math.radians(shin_angle)
    fwd = (math.cos(a), -math.sin(a))
    down = (math.sin(a), math.cos(a))
    p0 = (ankle[0] - fwd[0] * 6 + down[0] * 2, ankle[1] - fwd[1] * 6 + down[1] * 2)
    p1 = (ankle[0] + fwd[0] * 20 + down[0] * 4, ankle[1] + fwd[1] * 20 + down[1] * 4)
    stroke_line(cr, [p0, p1], 11, color)


def draw_leg(cr, hip, th, sh, color, shoe_color):
    knee = limb(hip, th, THIGH)
    ankle = limb(knee, sh, SHIN)
    stroke_line(cr, [hip, knee], 21, color)
    stroke_line(cr, [knee, ankle], 17, color)
    if shoe_color is not None:
        shoe(cr, ankle, sh, shoe_color)


def draw_head(cr, P, t, glasses_on, rim=0.0):
    c = P["head"]
    ang = P["headang"]
    cr.save()
    cr.translate(*c)
    cr.rotate(math.radians(ang))
    cr.scale(0.86, 0.86)
    rrect(cr, -6, 12, 13, 14, 4)
    cr.set_source_rgb(*SKIN_SHADE)
    cr.fill()
    cr.save()
    cr.scale(1.0, 1.08)
    circle(cr, (0, 0), 19, SKIN)
    cr.restore()
    cr.move_to(17, -2)
    cr.curve_to(24, 2, 23, 6, 17, 7)
    cr.set_source_rgb(*SKIN)
    cr.fill()
    cr.move_to(-4, 8)
    cr.curve_to(-2, 20, 8, 25, 16, 19)
    cr.curve_to(20, 16, 21, 12, 19, 9)
    cr.curve_to(14, 12, 6, 12, 2, 6)
    cr.close_path()
    cr.set_source_rgba(*HAIR, 0.82)
    cr.fill()
    stroke_line(cr, [(13, 9), (19, 8)], 2.2, HAIR, 0.9)
    cr.move_to(-20, 6)
    cr.curve_to(-24, -14, -12, -28, 4, -25)
    cr.curve_to(14, -28, 22, -22, 20, -12)
    cr.curve_to(14, -18, 8, -14, 2, -16)
    cr.curve_to(-2, -10, -8, -8, -10, -2)
    cr.curve_to(-12, 2, -14, 6, -20, 6)
    cr.set_source_rgb(*HAIR)
    cr.fill()
    for (a0, b0, c0, d0) in ((-2, -24, 6, -35), (5, -24, 15, -32), (-10, -20, -10, -31), (12, -20, 23, -24)):
        cr.move_to(a0, b0)
        cr.curve_to(a0 + 2, b0 - 6, c0, d0, c0 + 1, d0 + 2)
        cr.curve_to(c0 - 1, d0 + 6, a0 + 8, b0 + 2, a0 + 8, b0 + 4)
        cr.close_path()
        cr.set_source_rgb(*HAIR)
        cr.fill()
    cr.save()
    cr.translate(-5, 1)
    cr.scale(0.7, 1)
    circle(cr, (0, 0), 5, SKIN_SHADE)
    cr.restore()
    eyes = val("eyes", t)
    blink = 0
    for bt in (6.3, 10.2, 14.4, 16.9, 19.6):
        if abs(t - bt) < 0.08:
            blink = 1
    if eyes < 0.5 or blink:
        stroke_line(cr, [(7, -1), (12, -1)], 1.6, (0.15, 0.1, 0.1))
    else:
        circle(cr, (10, -2), 1.9, (0.08, 0.06, 0.07))
    stroke_line(cr, [(6, -7), (13, -8)], 1.8, HAIR, 0.85)
    stroke_line(cr, [(11, 11), (15, 10)], 1.4, (0.35, 0.2, 0.18), 0.8)
    if glasses_on:
        cr.set_line_width(2)
        cr.set_source_rgba(0.06, 0.06, 0.08, 1)
        rrect(cr, 5, -6, 11, 8, 2)
        cr.stroke()
        stroke_line(cr, [(5, -3), (-6, -1)], 1.6, (0.06, 0.06, 0.08))
        cr.set_source_rgba(0.55, 0.85, 1.0, 0.18 + 0.4 * rim)
        rrect(cr, 5, -6, 11, 8, 2)
        cr.fill()
        if rim > 0.05:
            stroke_line(cr, [(7, -4), (10, -5.5)], 1.2, (1, 1, 1), 0.55 * rim)
    if rim > 0.01:
        cr.arc(0, 0, 19, -0.45 * math.pi, 0.4 * math.pi)
        cr.set_source_rgba(*THEME_TEAL, 0.45 * rim)
        cr.set_line_width(2.2)
        cr.stroke()
    cr.restore()


def draw_torso(cr, P, rim):
    hip = P["hip"]
    cr.save()
    cr.translate(*hip)
    cr.rotate(math.radians(P["torso"]))
    cr.move_to(-17, 6)
    cr.curve_to(-22, -20, -24, -46, -19, -64)
    cr.curve_to(-15, -76, -2, -80, 6, -77)
    cr.curve_to(15, -74, 19, -64, 19, -52)
    cr.curve_to(22, -36, 22, -14, 18, 6)
    cr.curve_to(6, 10, -6, 10, -17, 6)
    cr.close_path()
    cr.set_source_rgb(*HOODIE)
    cr.fill_preserve()
    if rim > 0.01:
        cr.save()
        cr.clip()
        cr.move_to(19, -64)
        cr.curve_to(22, -40, 23, -14, 18, 8)
        cr.set_source_rgba(*THEME_TEAL, 0.55 * rim)
        cr.set_line_width(4)
        cr.stroke()
        cr.restore()
    cr.new_path()
    stroke_line(cr, [(-2, -30), (17, -30)], 1.2, (0, 0, 0), 0.25)
    stroke_line(cr, [(-2, -30), (-2, -6)], 1.2, (0, 0, 0), 0.25)
    rrect(cr, -17, 0, 35, 8, 3)
    cr.set_source_rgba(0, 0, 0, 0.18)
    cr.fill()
    cr.move_to(-22, -66)
    cr.curve_to(-30, -78, -14, -90, -2, -82)
    cr.curve_to(-10, -78, -14, -72, -12, -62)
    cr.close_path()
    cr.set_source_rgb(*HOODIE_BACK)
    cr.fill()
    stroke_line(cr, [(9, -72), (11, -54)], 1.3, (0.85, 0.87, 0.92), 0.7)
    stroke_line(cr, [(13, -71), (15, -56)], 1.3, (0.85, 0.87, 0.92), 0.7)
    cr.arc(-3, -80, 13, 0.85 * math.pi, 2.1 * math.pi)
    cr.set_source_rgb(0.06, 0.06, 0.08)
    cr.set_line_width(3.5)
    cr.stroke()
    rrect(cr, 4, -82, 9, 13, 4)
    cr.set_source_rgb(0.07, 0.07, 0.1)
    cr.fill()
    cr.arc(8.5, -75.5, 3.2, 0, 2 * math.pi)
    cr.set_source_rgba(*THEME_TEAL, 0.55)
    cr.set_line_width(1.2)
    cr.stroke()
    cr.restore()


def draw_mug(cr, hand, steam_t, steam_on=True):
    x, y = hand
    cr.set_source_rgb(0.86, 0.36, 0.30)
    rrect(cr, x + 3, y - 11, 17, 22, 3)
    cr.fill()
    cr.set_source_rgba(1, 1, 1, 0.12)
    rrect(cr, x + 5, y - 9, 4, 18, 2)
    cr.fill()
    cr.set_line_width(3)
    cr.set_source_rgb(0.86, 0.36, 0.30)
    cr.arc(x + 3, y, 5.5, math.pi / 2, 3 * math.pi / 2)
    cr.stroke()
    if steam_on:
        for i, dx in enumerate((7, 14)):
            ph = steam_t * 2 * math.pi / 2.0 + i * 2.1
            alpha = 0.18 + 0.1 * math.sin(ph)
            cr.set_line_width(1.6)
            cr.set_source_rgba(0.9, 0.95, 1, alpha)
            cr.move_to(x + dx, y - 14)
            cr.curve_to(x + dx + 4 * math.sin(ph), y - 20, x + dx - 4 * math.sin(ph + 1), y - 26, x + dx + 2 * math.sin(ph), y - 32)
            cr.stroke()


def draw_glasses_loose(cr, p, angle=0):
    cr.save()
    cr.translate(*p)
    cr.rotate(angle)
    cr.set_line_width(1.8)
    cr.set_source_rgb(0.05, 0.05, 0.07)
    rrect(cr, -12, -3, 10, 6, 2)
    cr.stroke()
    rrect(cr, 2, -3, 10, 6, 2)
    cr.stroke()
    stroke_line(cr, [(-2, -1), (2, -1)], 1.5, (0.05, 0.05, 0.07))
    cr.restore()


def glow(cr, cx, cy, r, color, alpha):
    g = cairo.RadialGradient(cx, cy, 0, cx, cy, r)
    g.add_color_stop_rgba(0, *color, alpha)
    g.add_color_stop_rgba(1, *color, 0)
    cr.set_source(g)
    cr.paint()


def code_lines(cr, x, y, w, h, t, seed, bright, color):
    cr.save()
    rrect(cr, x, y, w, h, 3)
    cr.clip()
    lh = 8.0
    n = 16
    speed = n * lh / LOOP
    off = (t * speed) % (n * lh)
    palette = [THEME_TEAL, THEME_BLUE, THEME_VIOLET, (0.95, 0.75, 0.35), (0.85, 0.88, 0.95)]
    for k in range(-1, int(h / lh) + 3):
        idx = (k + int(off // lh)) % n
        yy = y + 6 + k * lh - (off % lh)
        indent = ((idx * 7 + seed * 3) % 4) * 7
        segs = 1 + (idx * 5 + seed) % 3
        xx = x + 7 + indent
        for sgi in range(segs):
            ln = 10 + ((idx * 13 + seed * 7 + sgi * 11) % 28)
            if xx + ln > x + w - 6:
                break
            c = palette[(idx + sgi + seed) % len(palette)]
            cr.set_source_rgba(*c, 0.75 * bright)
            rrect(cr, xx, yy, ln, 3.2, 1.5)
            cr.fill()
            xx += ln + 5
    cr.restore()


def monitor(cr, x, y, w, h, tilt, t, seed, bright, color):
    cr.save()
    cr.translate(x, y)
    cr.transform(cairo.Matrix(1, tilt, 0, 1, 0, 0))
    cr.set_source_rgb(0.05, 0.06, 0.09)
    rrect(cr, -4, -4, w + 8, h + 8, 5)
    cr.fill()
    g = cairo.LinearGradient(0, 0, 0, h)
    g.add_color_stop_rgba(0, *[c * 0.22 for c in color], 1)
    g.add_color_stop_rgba(1, 0.03, 0.04, 0.08, 1)
    cr.set_source(g)
    rrect(cr, 0, 0, w, h, 3)
    cr.fill()
    code_lines(cr, 0, 0, w, h, t, seed, bright, color)
    cr.set_source_rgba(*color, 0.10 * bright)
    rrect(cr, 0, 0, w, h, 3)
    cr.fill()
    cr.restore()
    cr.set_source_rgb(0.07, 0.08, 0.11)
    cx = x + w / 2
    cr.rectangle(cx - 4, y + h + 4 + tilt * w / 2, 8, 14)
    cr.fill()
    rrect(cr, cx - 18, y + h + 16 + tilt * w / 2, 36, 5, 2)
    cr.fill()


def background(cr, t, screen_b):
    g = cairo.LinearGradient(0, 0, 0, FLOOR)
    g.add_color_stop_rgb(0, 0.028, 0.038, 0.075)
    g.add_color_stop_rgb(1, 0.045, 0.06, 0.11)
    cr.set_source(g)
    cr.rectangle(-200, -300, W + 400, FLOOR + 300)
    cr.fill()
    g = cairo.LinearGradient(0, FLOOR, 0, H)
    g.add_color_stop_rgb(0, 0.05, 0.06, 0.10)
    g.add_color_stop_rgb(1, 0.02, 0.025, 0.045)
    cr.set_source(g)
    cr.rectangle(-200, FLOOR, W + 400, H - FLOOR + 200)
    cr.fill()
    stroke_line(cr, [(0, FLOOR), (W, FLOOR)], 2, (0.12, 0.15, 0.24), 0.8)
    wx, wy, ww, wh = 140, 170, 170, 175
    cr.set_source_rgb(0.03, 0.04, 0.07)
    rrect(cr, wx - 8, wy - 8, ww + 16, wh + 16, 4)
    cr.fill()
    g = cairo.LinearGradient(wx, wy, wx + ww, wy + wh)
    g.add_color_stop_rgb(0, 0.10, 0.16, 0.32)
    g.add_color_stop_rgb(1, 0.06, 0.08, 0.18)
    cr.set_source(g)
    cr.rectangle(wx, wy, ww, wh)
    cr.fill()
    circle(cr, (wx + 120, wy + 48), 14, (0.86, 0.9, 1.0), 0.85)
    circle(cr, (wx + 126, wy + 44), 13, (0.10, 0.15, 0.30), 1)
    for i, (sx, sy) in enumerate(((wx + 30, wy + 30), (wx + 70, wy + 60), (wx + 45, wy + 110), (wx + 150, wy + 120), (wx + 95, wy + 25))):
        tw = 0.5 + 0.5 * math.sin(2 * math.pi * t / 2.0 + i)
        circle(cr, (sx, sy), 1.3, (1, 1, 1), 0.3 + 0.4 * tw)
    for i in range(1, 9):
        stroke_line(cr, [(wx, wy + i * wh / 9), (wx + ww, wy + i * wh / 9)], 2, (0.03, 0.04, 0.07), 0.55)
    stroke_line(cr, [(wx + ww / 2, wy), (wx + ww / 2, wy + wh)], 5, (0.03, 0.04, 0.07))
    cr.move_to(wx + 10, FLOOR)
    cr.line_to(wx + ww + 60, FLOOR)
    cr.line_to(wx + ww + 140, H)
    cr.line_to(wx + 40, H)
    cr.close_path()
    cr.set_source_rgba(0.35, 0.5, 0.95, 0.05)
    cr.fill()
    cr.set_source_rgb(0.06, 0.08, 0.13)
    rrect(cr, 990, 210, 190, 8, 2)
    cr.fill()
    bx = 1000
    for i, (bw, bh, col) in enumerate(((12, 46, (0.35, 0.22, 0.55)), (10, 40, (0.14, 0.4, 0.45)), (14, 50, (0.2, 0.28, 0.55)), (9, 36, (0.5, 0.3, 0.25)), (12, 44, (0.18, 0.2, 0.3)))):
        cr.set_source_rgba(*col, 0.85)
        cr.rectangle(bx, 210 - bh, bw, bh)
        cr.fill()
        bx += bw + 3
    cr.save()
    cr.translate(1100, 210)
    cr.rotate(-0.25)
    cr.set_source_rgba(0.25, 0.22, 0.4, 0.85)
    cr.rectangle(0, -40, 11, 40)
    cr.fill()
    cr.restore()
    circle(cr, (1150, 192), 12, (0.16, 0.36, 0.3), 0.9)
    cr.set_source_rgb(0.25, 0.2, 0.18)
    cr.rectangle(1142, 196, 16, 14)
    cr.fill()
    px, py = 470, 190
    cr.set_source_rgb(0.05, 0.06, 0.1)
    rrect(cr, px, py, 84, 110, 3)
    cr.fill()
    cr.set_line_width(4)
    cr.set_line_cap(cairo.LINE_CAP_ROUND)
    cr.set_line_join(cairo.LINE_JOIN_ROUND)
    cr.set_source_rgba(*THEME_TEAL, 0.45)
    cr.move_to(px + 24, py + 40)
    cr.line_to(px + 12, py + 55)
    cr.line_to(px + 24, py + 70)
    cr.stroke()
    cr.set_source_rgba(*THEME_VIOLET, 0.45)
    cr.move_to(px + 60, py + 40)
    cr.line_to(px + 72, py + 55)
    cr.line_to(px + 60, py + 70)
    cr.stroke()
    cr.set_source_rgba(*THEME_BLUE, 0.45)
    cr.move_to(px + 48, py + 36)
    cr.line_to(px + 36, py + 74)
    cr.stroke()


def furniture_back(cr, t, screen_b):
    cx0, cx1, ctop = 600, 730, 472
    cr.set_source_rgb(0.08, 0.09, 0.14)
    rrect(cr, cx0 - 6, ctop, cx1 - cx0 + 12, 9, 2)
    cr.fill()
    cr.set_source_rgb(0.06, 0.07, 0.11)
    cr.rectangle(cx0 + 6, ctop + 9, cx1 - cx0 - 12, FLOOR - ctop - 9)
    cr.fill()
    stroke_line(cr, [(cx0 + 12, ctop + 60), (cx1 - 12, ctop + 60)], 1.5, (0.12, 0.14, 0.2))
    circle(cr, ((cx0 + cx1) / 2, ctop + 36), 2.5, (0.2, 0.22, 0.3))
    circle(cr, ((cx0 + cx1) / 2, ctop + 92), 2.5, (0.2, 0.22, 0.3))
    cr.set_source_rgb(0.28, 0.2, 0.17)
    cr.move_to(706, ctop)
    cr.line_to(710, ctop - 22)
    cr.line_to(726, ctop - 22)
    cr.line_to(730, ctop)
    cr.close_path()
    cr.fill()
    for i, (dx, ang) in enumerate(((0, -0.5), (6, 0.1), (-6, -0.9), (10, 0.6))):
        cr.save()
        cr.translate(718 + dx * 0.3, ctop - 22)
        cr.rotate(ang)
        cr.scale(1, 2.4)
        circle(cr, (0, -6), 6, (0.14, 0.38, 0.32), 0.95)
        cr.restore()
    cr.set_source_rgb(0.86, 0.75, 0.5)
    rrect(cr, 646, ctop - 3, 3, 3, 1)
    cr.fill()
    dx0, dx1, dtop = 905, 1240, 492
    for i, (mx, my, mw, mh, tilt, col) in enumerate(((930, 336, 92, 70, -0.10, THEME_TEAL), (1032, 318, 118, 86, 0.0, THEME_BLUE), (1160, 336, 72, 70, 0.10, THEME_VIOLET))):
        pass
    glow(cr, 1080, 352, 220, THEME_VIOLET, 0.08 * screen_b)
    cr.set_source_rgba(*THEME_VIOLET, 0.55 * screen_b)
    rrect(cr, 940, 350, 280, 2, 1)
    cr.fill()
    cr.save()
    for (mx, my, mw, mh, tilt, col) in ((930, 374, 92, 70, -0.10, THEME_TEAL), (1032, 358, 118, 86, 0.0, THEME_BLUE), (1160, 374, 72, 70, 0.10, THEME_VIOLET)):
        glow(cr, mx + mw / 2, my + mh / 2, 260, col, 0.10 * screen_b)
    cr.restore()
    seeds = (1, 2, 3)
    for (mx, my, mw, mh, tilt, col), sd in zip(((930, 382, 92, 70, -0.10, THEME_TEAL), (1032, 366, 118, 86, 0.0, THEME_BLUE), (1160, 382, 72, 70, 0.10, THEME_VIOLET)), seeds):
        monitor(cr, mx, my, mw, mh, tilt, t, sd, screen_b, col)
    for (nx, ny, nc, na) in ((924, 380, (0.95, 0.85, 0.35), -0.15), (926, 397, (0.95, 0.5, 0.7), 0.1)):
        cr.save()
        cr.translate(nx, ny)
        cr.rotate(na)
        cr.set_source_rgba(*nc, 0.8)
        cr.rectangle(0, 0, 11, 11)
        cr.fill()
        cr.restore()
    cr.set_source_rgb(0.09, 0.10, 0.16)
    rrect(cr, dx0, dtop, dx1 - dx0, 10, 2)
    cr.fill()
    cr.set_source_rgb(0.06, 0.07, 0.11)
    cr.rectangle(dx0 + 14, dtop + 10, 10, FLOOR - dtop - 10)
    cr.fill()
    cr.rectangle(dx1 - 24, dtop + 10, 10, FLOOR - dtop - 10)
    cr.fill()
    hue = (t % LOOP) / LOOP
    def rgb_cycle(h):
        cols = [THEME_TEAL, THEME_BLUE, THEME_VIOLET, THEME_TEAL]
        h = (h % 1) * 3
        i = int(h)
        f = h - i
        return tuple(lerp(a, b, f) for a, b in zip(cols[i], cols[i + 1]))
    kb = rgb_cycle(hue)
    glow(cr, 964, dtop - 2, 40, kb, 0.35 * screen_b)
    cr.set_source_rgb(0.1, 0.11, 0.16)
    rrect(cr, 936, dtop - 7, 58, 7, 2)
    cr.fill()
    for i in range(9):
        cr.set_source_rgb(0.17, 0.18, 0.25)
        rrect(cr, 939 + i * 6, dtop - 10, 4.6, 3.5, 1)
        cr.fill()
    cr.set_source_rgba(*kb, 0.8 * screen_b)
    rrect(cr, 937, dtop - 1.5, 56, 1.5, 1)
    cr.fill()
    cr.set_source_rgb(0.08, 0.09, 0.14)
    rrect(cr, 1000, dtop - 2, 50, 2, 1)
    cr.fill()
    cr.set_source_rgb(0.14, 0.15, 0.22)
    cr.save()
    cr.translate(1024, dtop - 5)
    cr.scale(1.6, 1)
    cr.arc(0, 0, 4.5, math.pi, 2 * math.pi)
    cr.restore()
    cr.fill()
    cr.set_source_rgba(*kb, 0.6 * screen_b)
    cr.arc(1024, dtop - 4, 1.2, 0, 2 * math.pi)
    cr.fill()
    cr.set_source_rgb(0.93, 0.78, 0.2)
    cr.arc(1196, dtop - 8, 7, 0, 2 * math.pi)
    cr.fill()
    cr.arc(1201, dtop - 17, 5, 0, 2 * math.pi)
    cr.fill()
    cr.set_source_rgb(0.95, 0.55, 0.15)
    cr.move_to(1205, dtop - 18)
    cr.line_to(1211, dtop - 16)
    cr.line_to(1205, dtop - 14)
    cr.close_path()
    cr.fill()
    circle(cr, (1203, dtop - 19), 0.9, (0.05, 0.05, 0.05))
    cr.set_source_rgb(0.12, 0.45, 0.45)
    rrect(cr, 1218, dtop - 22, 11, 22, 2)
    cr.fill()
    cr.set_source_rgba(0.85, 0.95, 0.95, 0.7)
    cr.rectangle(1218, dtop - 15, 11, 3)
    cr.fill()
    tx0, ty0 = 1150, 500
    cr.set_source_rgb(0.06, 0.065, 0.1)
    rrect(cr, tx0, ty0, 62, FLOOR - ty0 - 2, 3)
    cr.fill()
    cr.set_source_rgba(0.5, 0.6, 0.9, 0.12)
    rrect(cr, tx0 + 6, ty0 + 6, 50, FLOOR - ty0 - 14, 2)
    cr.fill()
    for k, fy in enumerate((ty0 + 26, ty0 + 66)):
        fc = rgb_cycle(hue + k * 0.33)
        glow(cr, tx0 + 31, fy, 34, fc, 0.25 * screen_b)
        cr.set_source_rgba(*fc, 0.9 * screen_b)
        cr.set_line_width(2.2)
        cr.arc(tx0 + 31, fy, 13, 0, 2 * math.pi)
        cr.stroke()
        rot = 2 * math.pi * (t % 1.0) * 1.0
        for b in range(3):
            aa = rot + b * 2 * math.pi / 3
            stroke_line(cr, [(tx0 + 31, fy), (tx0 + 31 + math.cos(aa) * 10, fy + math.sin(aa) * 10)], 2, fc, 0.5 * screen_b)
    glow(cr, 1090, FLOOR - 5, 300, THEME_BLUE, 0.05 * screen_b)
    glow(cr, 860, 440, 160, THEME_TEAL, 0.07 * screen_b)


def bed_back(cr):
    bx0, bx1, mtop = 40, 362, 548
    cr.set_source_rgb(0.07, 0.08, 0.13)
    rrect(cr, bx0, 455, 18, FLOOR - 455, 4)
    cr.fill()
    cr.set_source_rgb(0.08, 0.09, 0.14)
    cr.rectangle(bx0 + 6, mtop + 26, bx1 - bx0 - 6, 14)
    cr.fill()
    cr.rectangle(bx0 + 12, mtop + 40, 9, FLOOR - mtop - 40)
    cr.fill()
    cr.rectangle(bx1 - 16, mtop + 40, 9, FLOOR - mtop - 40)
    cr.fill()
    cr.set_source_rgb(0.18, 0.2, 0.28)
    rrect(cr, bx0 + 14, mtop, bx1 - bx0 - 14, 28, 8)
    cr.fill()
    cr.set_source_rgb(0.62, 0.66, 0.76)
    rrect(cr, 80, mtop - 18, 78, 22, 10)
    cr.fill()
    cr.set_source_rgba(0, 0, 0, 0.15)
    rrect(cr, 80, mtop - 6, 78, 10, 6)
    cr.fill()


def blanket(cr, t):
    bump = 1 - smooth((t - 1.8) / 1.0)
    pushed = smooth((t - 1.8) / 1.0)
    x0 = lerp(175, 150, pushed)
    top = 528 - 8 * bump
    cr.move_to(x0, 552)
    cr.curve_to(x0 - 4, top + 10, x0 + 20, top, x0 + 50, top + 2)
    cr.curve_to(240, top - 4 * bump, 300, top + 10 - 16 * bump, 372, 536 - 24 * bump)
    cr.line_to(376, 578)
    cr.curve_to(300, 584, 200, 580, x0, 578)
    cr.close_path()
    g = cairo.LinearGradient(0, top, 0, 580)
    g.add_color_stop_rgb(0, 0.27, 0.22, 0.48)
    g.add_color_stop_rgb(1, 0.17, 0.14, 0.32)
    cr.set_source(g)
    cr.fill()
    stroke_line(cr, [(x0 + 30, top + 12), (330, top + 16 - 6 * bump)], 1.5, (1, 1, 1), 0.06)


def chair_back(cr, t):
    sx = 862
    cr.set_source_rgb(0.08, 0.09, 0.14)
    rrect(cr, sx - 46, 418, 14, 104, 6)
    cr.fill()
    cr.set_source_rgb(0.1, 0.11, 0.17)
    rrect(cr, sx - 40, 534, 74, 12, 5)
    cr.fill()
    cr.set_source_rgb(0.07, 0.08, 0.12)
    cr.rectangle(sx - 6, 546, 8, 40)
    cr.fill()
    stroke_line(cr, [(sx - 34, 588), (sx + 30, 588)], 5, (0.07, 0.08, 0.12))
    for wx in (sx - 34, sx + 30, sx - 2):
        circle(cr, (wx, 594), 5, (0.05, 0.05, 0.08))


def vignette(cr):
    g = cairo.RadialGradient(W / 2, H * 0.55, H * 0.25, W / 2, H * 0.55, W * 0.75)
    g.add_color_stop_rgba(0, 0, 0, 0, 0)
    g.add_color_stop_rgba(1, 0, 0, 0, 0.55)
    cr.set_source(g)
    cr.paint()


def frame(t, path):
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
    cr = cairo.Context(surf)
    screen_b = 0.45 + 0.55 * smooth((t - 11.8) / 1.4)
    screen_b *= 0.94 + 0.06 * math.sin(2 * math.pi * t / 2.0)
    cr.set_source_rgb(0.028, 0.038, 0.075)
    cr.paint()
    S = 1.08
    cr.translate(640, 690)
    cr.scale(S, S)
    cr.translate(-640, -600)
    background(cr, t, screen_b)
    bed_back(cr)
    furniture_back(cr, t, screen_b)
    chair_back(cr, t)
    if t >= 2.6:
        blanket(cr, t)
    P = body_points(t)
    A = arms(t, P)
    glasses_on = t >= GLASSES_ON
    if t < GLASSES_PICK:
        draw_glasses_loose(cr, GLASSES_SPOT)
    mug_held = (MUG_PICK <= t < MUG_PLACE) or mug_in_hand_loop(t)
    if t < MUG_PICK:
        draw_mug(cr, MUG_SPOT, t)
    elif t >= MUG_PLACE and not mug_held:
        draw_mug(cr, DESK_MUG, t)
    draw_leg(cr, P["hip"], P["bth"], P["bsh"], PANTS_BACK, SHOE_BACK if t > 1.7 else None)
    stroke_line(cr, [A["bsh"], A["be"], A["bh"]], 14, HOODIE_BACK)
    circle(cr, A["bh"], 6, SKIN_SHADE)
    draw_leg(cr, P["hip"], P["fth"], P["fsh"], PANTS, SHOE if t > 1.7 else None)
    hip, neck = P["hip"], P["neck"]
    rim = screen_b * smooth((hip[0] - 560) / 260)
    draw_torso(cr, P, rim)
    draw_head(cr, P, t, glasses_on, rim)
    stroke_line(cr, [P["shoulder"], A["fe"], A["fh"]], 15, HOODIE)
    if mug_held:
        draw_mug(cr, A["fh"], t)
    circle(cr, A["fh"], 6.5, SKIN)
    if GLASSES_PICK <= t < GLASSES_ON:
        draw_glasses_loose(cr, (A["fh"][0] + 6, A["fh"][1] - 4), -0.3)
    if t < 2.6:
        blanket(cr, t)
    cr.identity_matrix()
    vignette(cr)
    surf.write_to_png(path)


if __name__ == "__main__":
    out = sys.argv[1]
    mode = sys.argv[2]
    os.makedirs(out, exist_ok=True)
    if mode == "test":
        for tt in [float(x) for x in sys.argv[3].split(",")]:
            frame(tt, os.path.join(out, f"t_{tt:05.2f}.png"))
    else:
        start, end = float(sys.argv[3]), float(sys.argv[4])
        n = int(round((end - start) * FPS))
        for i in range(n):
            frame(start + i / FPS, os.path.join(out, f"f_{i:05d}.png"))
