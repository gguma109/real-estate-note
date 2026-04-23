import { onRequestDelete as __api_notes_js_onRequestDelete } from "C:\\Users\\xyz30\\.gemini\\antigravity\\scratch\\move_out_confirmation\\functions\\api\\notes.js"
import { onRequestGet as __api_notes_js_onRequestGet } from "C:\\Users\\xyz30\\.gemini\\antigravity\\scratch\\move_out_confirmation\\functions\\api\\notes.js"
import { onRequestPost as __api_notes_js_onRequestPost } from "C:\\Users\\xyz30\\.gemini\\antigravity\\scratch\\move_out_confirmation\\functions\\api\\notes.js"
import { onRequestGet as __api_profile_js_onRequestGet } from "C:\\Users\\xyz30\\.gemini\\antigravity\\scratch\\move_out_confirmation\\functions\\api\\profile.js"
import { onRequestPost as __api_profile_js_onRequestPost } from "C:\\Users\\xyz30\\.gemini\\antigravity\\scratch\\move_out_confirmation\\functions\\api\\profile.js"
import { onRequestDelete as __api_rentals_js_onRequestDelete } from "C:\\Users\\xyz30\\.gemini\\antigravity\\scratch\\move_out_confirmation\\functions\\api\\rentals.js"
import { onRequestGet as __api_rentals_js_onRequestGet } from "C:\\Users\\xyz30\\.gemini\\antigravity\\scratch\\move_out_confirmation\\functions\\api\\rentals.js"
import { onRequestPost as __api_rentals_js_onRequestPost } from "C:\\Users\\xyz30\\.gemini\\antigravity\\scratch\\move_out_confirmation\\functions\\api\\rentals.js"
import { onRequestGet as __api_shared_js_onRequestGet } from "C:\\Users\\xyz30\\.gemini\\antigravity\\scratch\\move_out_confirmation\\functions\\api\\shared.js"

export const routes = [
    {
      routePath: "/api/notes",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_notes_js_onRequestDelete],
    },
  {
      routePath: "/api/notes",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_notes_js_onRequestGet],
    },
  {
      routePath: "/api/notes",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_notes_js_onRequestPost],
    },
  {
      routePath: "/api/profile",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_profile_js_onRequestGet],
    },
  {
      routePath: "/api/profile",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_profile_js_onRequestPost],
    },
  {
      routePath: "/api/rentals",
      mountPath: "/api",
      method: "DELETE",
      middlewares: [],
      modules: [__api_rentals_js_onRequestDelete],
    },
  {
      routePath: "/api/rentals",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_rentals_js_onRequestGet],
    },
  {
      routePath: "/api/rentals",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_rentals_js_onRequestPost],
    },
  {
      routePath: "/api/shared",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_shared_js_onRequestGet],
    },
  ]