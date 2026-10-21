# Fulbo — Contexto del Proyecto

## Descripción
App PWA de fútbol amateur entre amigos llamada **Fulbo**. Permite confirmar asistencia a partidos,
generar equipos equilibrados, votar MVP y ver estadísticas del grupo.

---

## Stack técnico
- **Frontend:** React (Vite) + Tailwind CSS
- **Backend/DB:** Firebase (Firestore + Auth + Hosting)
- **Plataforma:** PWA (sin publicar en tiendas)
- **Dev:** conocimiento básico HTML/JS, aprendiendo React

---

## Modelo de datos (Firestore)

```
GRUPO:          id, nombre, codigo_invitacion (6 chars), admin_uid, miembros_uids[], creado_en
  └ solicitudes/{uid}: uid, email, nombre_display, foto_url, codigo, estado (pendiente|vinculado), creado_en
CODIGO_INVITACION: id = código, grupo_id, grupo_nombre   (lookup por código)
MIEMBRO_GRUPO:  id = {grupo_id}_{jugador_id}, grupo_id, jugador_id, rol (admin|jugador), unido_en
JUGADOR:        id, grupo_id, uid_firebase (null hasta vincular, único por grupo), nombre, foto_url,
                nivel_general (1-5), posicion_preferida (ARQ/DEF/MED/DEL), activo, club (opcional), creado_en,
                partidos_jugados, partidos_ganados, partidos_empatados, partidos_perdidos (default 0;
                se suman solo al cerrar un partido, el admin puede ajustarlos a mano)
PARTIDO:        id, grupo_id, fecha, lugar, estado (abierto → votando → confirmado → jugado), duracion_min,
                cupo_maximo (default 10), creado_en,
                resultado_equipo1, resultado_equipo2, diferencia_goles (equipo1 − equipo2), cerrado_en
                (null hasta que el admin lo cierra; 'jugado' es final y no se reabre),
                mvp_estado (null|abierta|cerrada), mvp_abierto_en, mvp_cerrado_en, mvp_cerrado_por,
                mvp_ganador_jugador_id, mvp_resultados [{jugador_id, votos}]
EQUIPO_PARTIDO: id = partido_id, grupo_id, combinaciones, combinacion_confirmada
PARTICIPACION:  id, grupo_id, jugador_id, partido_id, confirmo_asistencia, es_suplente, inscripto_en,
                votos_equipos, asistio, goles_marcados, voto_mvp (true = ya votó al MVP)
                (titular = confirmó y no es suplente; solo los titulares votan y arman equipos)
                (asistio lo marca el admin al cerrar el partido; solo los que asistieron votan MVP)
VOTO_MVP:       id = {partido_id}_{votante_jugador_id}, grupo_id, partido_id, votante_jugador_id,
                votado_jugador_id, votante_participacion_id, votado_participacion_id, creado_en
                (secreto hasta que mvp_estado = cerrada; un voto por jugador y partido)
NOTICIA:        id, titulo, url_externa, fuente, imagen_url, publicada_en
NOTIFICACION:   id, grupo_id, destinatario_uid (null = todo el grupo), jugador_id, tipo, mensaje,
                autor_uid, leida_por[] (uids), creada_en, datos_extra (partido_id, fecha, lugar, ...)
```

- Un JUGADOR pertenece a un solo grupo: la misma persona en dos grupos tiene dos jugadores
  (cada grupo asigna su propio nivel).
- Permisos aplicados en `FULBO-APP/firestore.rules`. Toda consulta debe filtrar por `grupo_id`.

---

## Algoritmo de generación de equipos
- Fútbol 5 (5 vs 5)
- Prioridad 1: distribuir arqueros (1 por equipo si hay 2 disponibles)
- Prioridad 2: minimizar diferencia de suma de niveles entre equipos
- Generar hasta 8 combinaciones alternativas para consenso grupal
- Niveles asignados manualmente por el admin (nunca auto-calculados)

---

## Pantallas (navbar inferior con 4 secciones)
1. **Partido** — confirmación de asistencia + generador de equipos
2. **Stats** — tabla de goleadores, partidos jugados, MVPs ganados
3. **MVP** — votación post-partido con resultados parciales
4. **Noticias** — feed de fútbol profesional vía API externa

---

## Cierre de partido
- El admin cierra el partido (estado confirmado y fecha ya pasada) cargando el resultado y
  quién asistió. En una transacción: partido → 'jugado', asistio en cada participación y
  +1 a partidos_jugados y ganados/empatados/perdidos del jugador según su equipo.
- Al cerrar se abre la votación MVP (24 hs), que sigue en la pestaña MVP.

## Reglas de negocio importantes
- Los niveles los asigna **solo el admin** manualmente, nunca se auto-calculan
- No hay drag & drop (Fase 1): el admin cambia jugadores de equipo tocando (seleccionar + intercambiar)
  desde "Cambiar jugadores de equipo"; votando, eso borra los votos de esa propuesta
- El consenso de equipos se logra regenerando combinaciones alternativas
- Usuarios esperados: 5–20 personas (grupo de amigos)

---

## Fase actual: Fase 1 — MVP
**Próximo paso:** configurar proyecto React + Firebase y crear el ABM de jugadores.

### Tareas pendientes Fase 1
- [ ] Inicializar proyecto Vite + React + Tailwind
- [ ] Configurar Firebase (Firestore + Auth + Hosting)
- [ ] ABM de jugadores (alta, baja, modificación, listado)
- [ ] Pantalla Partido: confirmación de asistencia
- [ ] Generador de equipos con algoritmo definido
- [ ] Pantalla Stats
- [x] Pantalla MVP: votación
- [ ] Pantalla Noticias: consumo de API externa

---

## Convenciones de código
- Componentes en `src/components/`
- Páginas en `src/pages/`
- Lógica Firebase en `src/firebase/`
- Hooks custom en `src/hooks/`
- Usar `async/await` (no `.then()`)
- Comentarios en español
- Nombrar variables y funciones en camelCase en español cuando sea posible
  (ej: `jugadores`, `obtenerPartidos`, `confirmarAsistencia`)

---

## Comandos útiles
```bash
npm run dev       # servidor de desarrollo
npm run build     # build de producción
firebase deploy   # deploy a Firebase Hosting
```