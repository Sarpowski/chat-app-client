# Pine Chat — Fix Task List

Bilinen hatalar ve yapılması gerekenler. Öncelik sırasına göre.

---

## FIX-1 · Refresh'te login'e atma (kritik)

**Sorun:** JWT sadece Pinia store'un memory'sinde tutuluyor. Sayfa refresh'i yapılınca token sıfırlanıyor, router guard `isAuthenticated = false` görüyor ve kullanıcıyı `/login`'e atıyor.

**Çözüm:** `App.vue` mount'ta (veya `main.ts`'te) `/auth/refresh` endpoint'ini çağır. Backend HttpOnly cookie'deki refresh token'ı okur ve yeni bir JWT döner. Başarılıysa `setAuth()` çağır ve kullanıcı kaldığı sayfada kalır. Başarısızsa `/login`'e yönlendir.

**Dosyalar:**
- `src/App.vue` — `onMounted` içinde refresh dene
- `src/stores/auth.ts` — mevcut `refresh()` action zaten var, kullanılacak

**Detay:**
```
App mount
  → authStore.refresh() çağır
    → başarılı: hiçbir şey yapma, router guard geçer
    → 401/hata: clearAuth() + router.push('login')
  → sadece sonra router'ı aktif et (veya bir `appReady` flag koy)
```

Router guard refresh bitmeden çalışmamalı. Bunun için `appReady` flag veya `router.isReady()` kombinasyonu kullanılabilir.

---

## FIX-2 · Anasayfa `/` → `/register` yönlendirmesi

**Sorun:** `router/index.ts`'te `path: '/'` şu an `/conversations`'a redirect ediyor. Unauthenticated kullanıcı için guard bunu `/login`'e çeviriyor. İstenen davranış: unauthenticated kullanıcı direkt `/register`'a gitsin.

**Çözüm:** `/` route'unu authenticated kontrolüne göre ayır.

```ts
// router/index.ts — beforeEach guard içine ekle
// VEYA redirect'i dinamik yap:
{
  path: '/',
  redirect: () => {
    const auth = useAuthStore()
    return auth.isAuthenticated ? '/conversations' : '/register'
  }
}
```

**Dosyalar:**
- `src/router/index.ts`

---

## FIX-3 · Login ↔ Register geçiş linkleri eksik

**Sorun:** `LoginPage.vue`'da register'a link yok. `RegisterPage.vue`'da login'e link yok. Kullanıcı URL'yi elle yazmak zorunda.

**Çözüm:** Her iki sayfaya da alt kısma `RouterLink` ekle.

```html
<!-- LoginPage.vue altına -->
<p>Don't have an account? <RouterLink to="/register">Register</RouterLink></p>

<!-- RegisterPage.vue altına -->
<p>Already have an account? <RouterLink to="/login">Sign in</RouterLink></p>
```

**Dosyalar:**
- `src/pages/LoginPage.vue`
- `src/pages/RegisterPage.vue`

---

## FIX-4 · `NewChatForm.vue` — duplicate input

**Sorun:** Formda hem `UserSearchInput` (disabled, dekoratif) hem de ayrı bir `username` input var. İkisi arasında bağlantı yok. `searchQuery` ref hiç kullanılmıyor. Kullanıcı ikisini de doldurmak zorunda gibi görünüyor.

**Çözüm:** `UserSearchInput` component'ini kaldır, sadece tek `username` input bırak. Zaten endpoint yok.

```html
<!-- NewChatForm.vue — temizlenmiş hali -->
<form class="new-chat" @submit.prevent="submit">
  <label>
    Username
    <input v-model="username" class="input" type="text" placeholder="Exact username" />
  </label>
  <p class="note">User search is not available yet. Enter exact username.</p>
  <button class="btn btn-primary" type="submit">Start conversation</button>
</form>
```

`searchQuery` ref'ini ve `UserSearchInput` import'unu da sil.

**Dosyalar:**
- `src/components/NewChatForm.vue`

---

## FIX-5 · `--border` CSS değişkeni tanımsız

**Sorun:** `ChatPage.vue`'daki `.message-pane` style'ında `border: 1px solid var(--border)` kullanılıyor ama `src/styles.css`'de `--border` tanımlanmamış. Border görünmüyor veya `unset` oluyor.

**Çözüm:** Ya `styles.css`'e `--border` ekle, ya da `ChatPage.vue`'da doğrudan renk kullan.

```css
/* styles.css :root içine ekle */
--border: rgba(30, 26, 22, 0.08);
```

**Dosyalar:**
- `src/styles.css`

---

## Özet tablosu

| Fix | Öncelik | Etki |
|-----|---------|------|
| FIX-1 Refresh'te login'e atma | 🔴 Kritik | Her refresh'te kullanıcı çıkış yapıyor |
| FIX-2 `/` → `/register` yönlendirme | 🟡 Orta | UX beklentisiyle uyuşmuyor |
| FIX-3 Login ↔ Register linkleri | 🟡 Orta | Kullanıcı sayfalar arası geçemiyor |
| FIX-4 Duplicate input | 🟢 Küçük | Kafa karışıklığı yaratıyor |
| FIX-5 `--border` tanımsız | 🟢 Küçük | Görsel kusur |
