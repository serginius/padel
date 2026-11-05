# Slice Pádel

App web de nuestro pádel: próximos partidos, resultados set por set, quién jugó con quién, ranking de jugadores y de parejas, y la carta de cada jugador con foto.

- Los resultados y el ranking se ven sin entrar (sirve para pasar el link por WhatsApp).
- Los jugadores entran con Google **solo si el admin cargó su Gmail**. Adentro editan su perfil (foto, lado drive/revés, categoría, mano).
- El admin carga jugadores, arma los partidos (las dos parejas) y carga el resultado de cada set.
- El ranking ordena por partidos ganados; si empatan, por efectividad y después por diferencia de sets y de games.

Hermana de la app de fútbol (github.com/serginius/futbol): mismo diseño y misma forma de trabajar.

Todo corre gratis: **Supabase** (base de datos, login con Google y fotos) + **Vercel** (la página online).

---

## Puesta en marcha (una sola vez, ~20 minutos)

### 1. Supabase: base de datos

1. Entrá a [supabase.com](https://supabase.com), creá una cuenta y un **New project** (plan Free). Ponele de nombre `padel` y elegí la región São Paulo.
2. Cuando termine de crearse, andá a **SQL Editor → New query**.
3. Abrí el archivo [`supabase/schema.sql`](supabase/schema.sql) de este repo, copiá todo y pegalo.
4. **Al final del archivo cambiá `tu-mail@gmail.com` por tu Gmail** (en minúsculas). Ese mail queda como admin.
5. Tocá **Run**. Tiene que decir "Success".
6. Andá a **Project Settings → API** (o **Data API**) y anotá dos cosas: la **Project URL** y la **anon public key**.

### 2. Google: botón "Entrar con Google"

1. Entrá a [console.cloud.google.com](https://console.cloud.google.com) con tu Gmail y creá un proyecto nuevo (`padel`).
2. Andá a **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo **Externo**, nombre de la app "Slice Pádel", tu mail de soporte. Guardá y **publicá la app** (botón "Publicar app"), así entra cualquiera que vos habilites.
3. Andá a **Credenciales → Crear credenciales → ID de cliente de OAuth** → tipo **Aplicación web**.
4. En **URIs de redireccionamiento autorizados** pegá la URL que te muestra Supabase en **Authentication → Sign In / Providers → Google** (es algo como `https://xxxx.supabase.co/auth/v1/callback`).
5. Copiá el **ID de cliente** y el **Secreto**, y pegalos en Supabase en esa misma pantalla de Google. Activá el provider y guardá.

### 3. Vercel: publicar la página

1. Entrá a [vercel.com](https://vercel.com) con tu cuenta de GitHub (plan Hobby, gratis).
2. **Add New → Project** → elegí este repo → **Import**.
3. En **Environment Variables** agregá:
   - `NEXT_PUBLIC_SUPABASE_URL` = la Project URL de Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = la anon public key
4. **Deploy**. En un minuto te da el link (por ejemplo `padel.vercel.app`). En **Settings → Domains** podés cambiarle el nombre.

### 4. Conectar todo

En Supabase → **Authentication → URL Configuration**:
- **Site URL**: tu link de Vercel (ej. `https://padel.vercel.app`)
- **Redirect URLs**: agregá `https://padel.vercel.app/**`

¡Listo! Entrá al link, tocá **Entrar** con tu Gmail y vas a ver la pestaña **Admin**.

---

## Uso diario

- **Habilitar a un jugador:** Admin → + Jugador, con su Gmail. Mientras la app de Google siga en modo Prueba, agregá también ese Gmail en Google Cloud → Público → Usuarios de prueba. Sin mail, el jugador aparece en el ranking pero no puede entrar.
- **Armar el partido:** Admin → + Nuevo partido. Elegís fecha, hora, club, cancha y los dos jugadores de cada pareja (si falta alguno, dejalo en "A confirmar").
- **Cargar el resultado:** abrí el partido → "Cargar resultado". Tildá "Ya se jugó" y poné los games de cada set. Si no hubo tercer set, dejalo vacío; si fue super tie-break, poné los puntos (ej. 10 a 8).
- **Otro admin:** Admin → Admins → agregar mail.

## Para programadores

```bash
cp .env.example .env.local   # completar con los datos de Supabase
npm install
npm run dev
```

Next.js 15 (App Router) + `@supabase/ssr`. Los permisos están en la base (Row Level Security en `supabase/schema.sql`): lectura pública, el admin escribe todo, cada jugador solo su perfil y su foto. Los sets de cada partido se guardan en `matches.sets` como `[[6,4],[3,6],[7,5]]`.
