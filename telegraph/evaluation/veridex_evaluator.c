#include <stdint.h>

/* Freestanding wasm32 evaluator for Telegraph Track 2. */
static uint8_t heap[131072];
/* Keep allocations above the linker data/static region. */
static uint32_t heap_top = 65536;
static float breakdown[5];

__attribute__((export_name("alloc")))
uint32_t alloc(uint32_t size) {
    if (size == 0) return 0;
    uint32_t p = (heap_top + 7u) & ~7u;
    if (p > sizeof(heap) || size > sizeof(heap) - p) return 0;
    heap_top = p + size;
    return p;
}

__attribute__((export_name("dealloc")))
void dealloc(uint32_t ptr, uint32_t size) {
    (void)ptr; (void)size;
}

static int is_space(uint8_t c) {
    return c == ' ' || c == '\n' || c == '\r' || c == '\t';
}

static uint8_t lower_ascii(uint8_t c) {
    return (c >= 'A' && c <= 'Z') ? (uint8_t)(c + 32) : c;
}

static int is_word_char(uint8_t c) {
    c = lower_ascii(c);
    return (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c >= 128;
}

static int is_stopword(const uint8_t *s, int n) {
    static const char *sw[] = {
        "a","an","and","are","as","at","be","by","for","from",
        "how","in","is","it","of","on","or","that","the","this",
        "to","was","were","what","when","where","which","who","with"
    };
    for (unsigned i = 0; i < sizeof(sw) / sizeof(sw[0]); i++) {
        int j = 0;
        while (j < n && sw[i][j] && lower_ascii(s[j]) == (uint8_t)sw[i][j]) j++;
        if (j == n && sw[i][j] == '\0') return 1;
    }
    return 0;
}

static int next_token(const uint8_t *s, int n, int *pos, int *start, int *len) {
    int i = *pos;
    while (i < n && !is_word_char(s[i])) i++;
    if (i >= n) { *pos = i; return 0; }
    int st = i;
    while (i < n && is_word_char(s[i])) i++;
    *start = st; *len = i - st; *pos = i;
    return 1;
}

static int token_equal(const uint8_t *a, int alen, const uint8_t *b, int blen) {
    if (alen != blen) return 0;
    for (int i = 0; i < alen; i++) {
        if (lower_ascii(a[i]) != lower_ascii(b[i])) return 0;
    }
    return 1;
}

static int count_tokens(const uint8_t *s, int n) {
    int p = 0, st = 0, len = 0, c = 0;
    while (next_token(s, n, &p, &st, &len)) {
        if (!is_stopword(s + st, len)) c++;
    }
    return c;
}

static int common_tokens(const uint8_t *a, int an, const uint8_t *b, int bn) {
    int pa = 0, sa = 0, la = 0, count = 0;
    while (next_token(a, an, &pa, &sa, &la)) {
        int pb = 0, sb = 0, lb = 0;
        int found = 0;
        while (next_token(b, bn, &pb, &sb, &lb)) {
            if (token_equal(a + sa, la, b + sb, lb)) { found = 1; break; }
        }
        if (found && !is_stopword(a + sa, la)) count++;
    }
    return count;
}

static int normalized_exact(const uint8_t *a, int an, const uint8_t *b, int bn) {
    int ia = 0, ib = 0;
    while (ia < an && (is_space(a[ia]) || a[ia] == '.' || a[ia] == ',' || a[ia] == ';' || a[ia] == ':' || a[ia] == '!' || a[ia] == '?')) ia++;
    while (ib < bn && (is_space(b[ib]) || b[ib] == '.' || b[ib] == ',' || b[ib] == ';' || b[ib] == ':' || b[ib] == '!' || b[ib] == '?')) ib++;
    int enda = an, endb = bn;
    while (enda > ia && (is_space(a[enda-1]) || a[enda-1] == '.' || a[enda-1] == ',' || a[enda-1] == ';' || a[enda-1] == ':' || a[enda-1] == '!' || a[enda-1] == '?')) enda--;
    while (endb > ib && (is_space(b[endb-1]) || b[endb-1] == '.' || b[endb-1] == ',' || b[endb-1] == ';' || b[endb-1] == ':' || b[endb-1] == '!' || b[endb-1] == '?')) endb--;
    if (enda - ia != endb - ib) return 0;
    for (int i = 0; i < enda - ia; i++) {
        if (lower_ascii(a[ia+i]) != lower_ascii(b[ib+i])) return 0;
    }
    return 1;
}

static float score_text(const uint8_t *gt, int gn, const uint8_t *ans, int an) {
    if (gn <= 0 || an <= 0) return 0.0f;
    if (normalized_exact(gt, gn, ans, an)) return 1.0f;

    int gt_tokens = count_tokens(gt, gn);
    int an_tokens = count_tokens(ans, an);
    if (gt_tokens <= 0 || an_tokens <= 0) return 0.0f;

    int common = common_tokens(gt, gn, ans, an);
    if (common <= 0) return 0.0f;

    int denom = gt_tokens > an_tokens ? gt_tokens : an_tokens;
    float overlap = (float)common / (float)denom;
    float len_ratio = (float)(gn < an ? gn : an) / (float)(gn > an ? gn : an);
    float score = overlap * (0.75f + 0.25f * len_ratio);
    if (score > 0.999f) score = 0.999f;
    if (score < 0.0f) score = 0.0f;
    return score;
}

__attribute__((export_name("rank_answer")))
float rank_answer(uint32_t q_ptr, uint32_t q_len,
                  uint32_t gt_ptr, uint32_t gt_len,
                  uint32_t ma_ptr, uint32_t ma_len) {
    (void)q_ptr; (void)q_len;
    const uint8_t *gt = (const uint8_t *)(uintptr_t)gt_ptr;
    const uint8_t *ans = (const uint8_t *)(uintptr_t)ma_ptr;
    return score_text(gt, (int)gt_len, ans, (int)ma_len);
}

__attribute__((export_name("breakdown_answer")))
uint32_t breakdown_answer(uint32_t q_ptr, uint32_t q_len,
                          uint32_t gt_ptr, uint32_t gt_len,
                          uint32_t ma_ptr, uint32_t ma_len) {
    (void)q_ptr; (void)q_len;
    const uint8_t *gt = (const uint8_t *)(uintptr_t)gt_ptr;
    const uint8_t *ans = (const uint8_t *)(uintptr_t)ma_ptr;
    float s = score_text(gt, (int)gt_len, ans, (int)ma_len);
    breakdown[0] = s;
    breakdown[1] = s;
    breakdown[2] = s;
    breakdown[3] = (gt_len > 0 && ma_len > 0)
        ? ((float)(gt_len < ma_len ? gt_len : ma_len) / (float)(gt_len > ma_len ? gt_len : ma_len))
        : 0.0f;
    breakdown[4] = s;
    return (uint32_t)(uintptr_t)breakdown;
}
