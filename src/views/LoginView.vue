<template>
  <main class="auth-page" dir="rtl">
    <div class="ambient ambient-one"></div>
    <div class="ambient ambient-two"></div>

    <section class="auth-shell" aria-label="تسجيل الدخول">
      <aside class="brand-panel">
        <div class="brand-mark" aria-hidden="true">
          <img src="/logo.png" alt="Octo Media" class="login-brand-img" />
        </div>

        <div class="brand-copy">
          <span class="eyebrow">مرحبًا بعودتك</span>
          <h1>غُص في<br /><strong>عالمك الرقمي</strong></h1>
          <p>مكان واحد يجمع فريقك، مهامك، وإنجازاتك تحت سطح واحد.</p>
        </div>

        <div class="depth-lines" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>

        <div class="panel-footer">
          <span class="pulse-dot"></span>
          <span>مساحتك آمنة ومتصلة</span>
        </div>
      </aside>

      <section class="form-panel">
        <div class="mobile-brand" aria-hidden="true">
          <img src="/logo.png" alt="Octo Media" class="login-brand-img mobile-logo" />
        </div>

        <div class="form-content">
          <div class="form-heading">
            <span class="form-kicker">بوابة الوصول</span>
            <h2>تسجيل الدخول</h2>
            <p>أدخل بياناتك للعودة إلى لوحة التحكم.</p>
          </div>

          <form @submit.prevent="handleLogin" novalidate>
            <div class="field-group">
              <label for="email">البريد الإلكتروني</label>
              <div class="input-wrap" :class="{ focused: focusedField === 'email' }">
                <svg class="field-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16v12H4zM4 7l8 6 8-6" /></svg>
                <input id="email" v-model.trim="form.email" type="email" autocomplete="email" placeholder="name@company.com" required @focus="focusedField = 'email'" @blur="focusedField = ''" />
              </div>
            </div>

            <div class="field-group">
              <div class="label-row">
                <label for="password">كلمة المرور</label>
                <!-- <a href="#" class="forgot-link" @click.prevent>نسيت كلمة المرور؟</a> -->
              </div>
              <div class="input-wrap" :class="{ focused: focusedField === 'password' }">
                <svg class="field-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></svg>
                <input id="password" v-model="form.password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="••••••••" required @focus="focusedField = 'password'" @blur="focusedField = ''" />
                <button type="button" class="visibility-btn" :aria-label="showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'" @click="showPassword = !showPassword">
                  <svg v-if="!showPassword" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg>
                  <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.2 3.7M6.1 6.8C3.8 8.4 2.5 12 2.5 12s3.5 6 9.5 6c1.5 0 2.8-.3 4-.8" /></svg>
                </button>
              </div>
            </div>

            <!-- تم تفعيل خيار "تذكرني" -->
            <label class="remember-row">
              <input type="checkbox" v-model="rememberMe" />
              <span class="custom-check"></span>
              <span>تذكرني على هذا الجهاز</span>
            </label>

            <button class="submit-btn" type="submit" :disabled="isLoading">
              <span v-if="!isLoading">دخول إلى المساحة <span class="arrow">←</span></span>
              <span v-else class="loading-state"><span class="spinner"></span> جارٍ التحقق...</span>
            </button>

            <p v-if="errorMessage" class="error-message" role="alert"><span>!</span>{{ errorMessage }}</p>
          </form>
        </div>

        <p class="form-footer">ليس لديك حساب؟ <a href="#" @click.prevent>تواصل مع المسؤول</a></p>
      </section>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../axios';

const router = useRouter();
const form = ref({ email: '', password: '' });
const errorMessage = ref('');
const isLoading = ref(false);
const showPassword = ref(false);
const rememberMe = ref(false);
const focusedField = ref('');

const handleLogin = async () => {
  errorMessage.value = '';
  if (!form.value.email || !form.value.password) {
    errorMessage.value = 'يرجى إدخال البريد الإلكتروني وكلمة المرور';
    return;
  }

  isLoading.value = true;
  try {
    // تم إضافة `remember` إلى الطلب المرسل للـ API
    const loginPayload = {
      email: form.value.email,
      password: form.value.password,
      remember: rememberMe.value
    };

    const response = await api.post('/login', loginPayload);
    const data = response.data.data;
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.role);
    
    localStorage.setItem('user_id', data.user.id);
    localStorage.setItem('user', JSON.stringify(data.user));

    if (data.user.role === 'manager') {
      router.push('/manager/dashboard');
    } else {
      router.push('/employee/dashboard');
    }
  } catch (error) {
    if (error.response?.data?.errors) {
      const firstError = Object.values(error.response.data.errors)[0];
      errorMessage.value = Array.isArray(firstError) ? firstError[0] : firstError;
    } else {
      errorMessage.value = error.response?.data?.message || 'بيانات الدخول غير صحيحة، يرجى التأكد من البريد وكلمة المرور';
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap');

:global(*) { box-sizing: border-box; }
:global(body) { margin: 0; font-family: 'Cairo', sans-serif; background: #080c24; }
.auth-page { min-height: 100vh; display: grid; place-items: center; padding: 28px; overflow: hidden; position: relative; color: #f6f7ff; background: radial-gradient(circle at 80% 5%, #24215a 0, transparent 36%), linear-gradient(135deg, #090d2b, #111641 58%, #251354); }
.ambient { position: absolute; border-radius: 50%; filter: blur(2px); opacity: .22; pointer-events: none; }
.ambient-one { width: 380px; height: 380px; right: -180px; top: -90px; background: #b54dff; }
.ambient-two { width: 260px; height: 260px; left: -100px; bottom: -90px; background: #00d8cc; }
.auth-shell { width: min(980px, 100%); min-height: 620px; display: grid; grid-template-columns: .9fr 1.1fr; position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,.14); border-radius: 28px; background: rgba(16, 20, 60, .74); box-shadow: 0 30px 90px rgba(0,0,0,.42), inset 0 1px rgba(255,255,255,.1); backdrop-filter: blur(20px); }
.brand-panel { position: relative; padding: 54px 46px; display: flex; flex-direction: column; background: linear-gradient(145deg, rgba(36, 32, 97, .9), rgba(18, 32, 82, .58)); border-left: 1px solid rgba(255,255,255,.11); overflow: hidden; }
.brand-panel::after { content: ''; position: absolute; width: 310px; height: 310px; bottom: -170px; right: -130px; border: 1px solid rgba(79, 231, 219, .22); border-radius: 46% 54% 62% 38%; transform: rotate(25deg); box-shadow: 0 0 0 20px rgba(79,231,219,.03), 0 0 0 40px rgba(79,231,219,.03); }
.brand-mark { width: 140px; height: 110px; display: flex; align-items: center; justify-content: flex-start; background: transparent; padding: 0; box-shadow: none; border-radius: 0; }
.login-brand-img { width: 100%; height: 100%; object-fit: contain; display: block; filter: drop-shadow(0 8px 24px rgba(0, 216, 204, 0.35)); }
.brand-copy { margin-top: 40px; max-width: 290px; }
.eyebrow, .form-kicker { color: #77e9df; font-size: 12px; font-weight: 700; letter-spacing: 1.4px; }
.brand-copy h1 { margin: 15px 0; font-size: clamp(32px, 4vw, 48px); line-height: 1.2; letter-spacing: -1px; }
.brand-copy h1 strong { color: #d8a0ff; font-weight: 800; }
.brand-copy p { color: #a6aed7; font-size: 14px; line-height: 2; }
.depth-lines { position: absolute; right: 0; bottom: 103px; display: grid; gap: 10px; opacity: .3; }
.depth-lines span { height: 1px; background: #77e9df; border-radius: 10px; }
.depth-lines span:nth-child(1) { width: 115px; }.depth-lines span:nth-child(2) { width: 76px; }.depth-lines span:nth-child(3) { width: 42px; }
.panel-footer { display: flex; align-items: center; gap: 9px; margin-top: auto; color: #8993c3; font-size: 12px; }
.pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: #63e4d9; box-shadow: 0 0 0 5px rgba(99,228,217,.12), 0 0 16px #63e4d9; }
.form-panel { display: flex; flex-direction: column; justify-content: center; padding: 58px clamp(30px, 7vw, 92px); background: rgba(9, 13, 42, .34); }
.form-content { width: 100%; max-width: 365px; margin: 0 auto; }
.form-heading { margin-bottom: 34px; }.form-heading h2 { margin: 8px 0 4px; font-size: 30px; letter-spacing: -.5px; }.form-heading p { color: #929bc6; font-size: 13px; margin: 0; }
.field-group { margin-bottom: 21px; } label { display: block; color: #d9ddf5; font-size: 13px; font-weight: 600; margin-bottom: 9px; }.label-row { display: flex; align-items: center; justify-content: space-between; }.forgot-link, .form-footer a { color: #b978ff; font-size: 11px; text-decoration: none; }.forgot-link:hover, .form-footer a:hover { color: #83ebe2; }
.input-wrap { display: flex; align-items: center; min-height: 52px; border: 1px solid rgba(142, 154, 213, .25); border-radius: 13px; background: rgba(9, 13, 42, .42); transition: .2s ease; }.input-wrap.focused, .input-wrap:focus-within { border-color: #78e8de; box-shadow: 0 0 0 4px rgba(120,232,222,.08); }.input-wrap input { width: 100%; border: 0; outline: 0; color: #f5f6ff; background: transparent; padding: 0 10px; font: inherit; font-size: 13px; direction: ltr; text-align: left; }.input-wrap input::placeholder { color: #626b98; }.field-icon { width: 18px; margin: 0 14px; fill: none; stroke: #7d88ba; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; flex: 0 0 auto; }.visibility-btn { width: 44px; height: 48px; display: grid; place-items: center; border: 0; color: #7d88ba; background: transparent; cursor: pointer; }.visibility-btn svg { width: 18px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }.visibility-btn:hover { color: #77e9df; }
.remember-row { display: flex; align-items: center; gap: 9px; color: #8f98c0; font-size: 11px; cursor: pointer; margin: 2px 0 25px; }.remember-row input { position: absolute; opacity: 0; }.custom-check { width: 16px; height: 16px; border: 1px solid #5f6a9f; border-radius: 5px; transition: .2s; }.remember-row input:checked + .custom-check { border-color: #77e9df; background: #77e9df; box-shadow: inset 0 0 0 3px #172052; }
.submit-btn { width: 100%; min-height: 52px; border: 0; border-radius: 13px; color: #11143a; background: linear-gradient(100deg, #83ece2, #b98aff); font: inherit; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 12px 25px rgba(119, 233, 223, .14); transition: transform .2s, box-shadow .2s, filter .2s; }.submit-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 16px 30px rgba(119, 233, 223, .23); }.submit-btn:disabled { opacity: .7; cursor: wait; }.arrow { font-size: 19px; margin-right: 6px; }.loading-state { display: inline-flex; gap: 9px; align-items: center; }.spinner { width: 15px; height: 15px; border: 2px solid rgba(17,20,58,.3); border-top-color: #11143a; border-radius: 50%; animation: spin .7s linear infinite; }
.error-message { display: flex; align-items: center; gap: 10px; color: #ff9eaf; font-size: 12px; font-weight: 600; margin: 16px 0 0; padding: 11px 14px; background: rgba(255, 103, 139, 0.12); border: 1px solid rgba(255, 155, 173, 0.3); border-radius: 12px; animation: shake 0.35s ease-in-out; }.error-message span { display: inline-grid; place-items: center; width: 18px; height: 18px; border: 1.5px solid currentColor; border-radius: 50%; font-weight: 800; flex-shrink: 0; }.form-footer { color: #747ea9; font-size: 11px; text-align: center; margin: 44px 0 0; }.mobile-brand { display: none; }
@keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-5px); } 40%, 80% { transform: translateX(5px); } }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) { .auth-page { padding: 16px; }.auth-shell { display: block; min-height: auto; border-radius: 22px; }.brand-panel { display: none; }.form-panel { padding: 30px 24px 26px; }.mobile-brand { display: flex; justify-content: center; align-items: center; margin-bottom: 30px; }.mobile-logo { height: 75px; width: auto; max-width: 170px; object-fit: contain; filter: drop-shadow(0 6px 20px rgba(0, 216, 204, 0.35)); }.form-heading h2 { font-size: 27px; } }
</style>