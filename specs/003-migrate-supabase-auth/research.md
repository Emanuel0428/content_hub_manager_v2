# Research: Supabase Integration and Authentication

## Decision 1: Desarrollo nuevo vs migración

- Decision: Implementar sistema nuevo con Supabase desde cero en lugar de migrar sistema existente.
- Rationale: No existe sistema legacy con datos críticos que migrar. Desarrollar nuevo permite aprovechar completamente las capacidades de Supabase sin restricciones de compatibilidad.
- Alternatives considered:
  - Migrar desde sistema SQLite existente: innecesario dado que no hay datos de producción críticos.
  - Híbrido (mantener algunos componentes): introduce complejidad sin beneficios claros.

## Decision 2: Arquitectura de autenticación

- Decision: Usar Supabase Auth completamente con frontend React y backend Node.js que valida tokens.
- Rationale: Supabase Auth maneja registro, login, sesiones y tokens JWT automáticamente. El backend solo necesita validar tokens para proteger endpoints.
- Alternatives considered:
  - Auth custom con bcrypt y JWT manual: reinventar la rueda y agregar complejidad de seguridad.
  - Auth híbrido: complicaría el flujo sin beneficios claros.

## Decision 3: Estructura de storage y assets

- Decision: Usar Supabase Storage con bucket público "Assets" y organización plana por filename.
- Rationale: Simplifica acceso a archivos, reduce complejidad de permisos, y permite URLs públicas directas para previews.
- Alternatives considered:
  - Bucket privado con signed URLs: más seguro pero complica previews y CDN.
  - Estructura de carpetas por usuario/plataforma: agrega complejidad sin beneficios claros.
  - Storage externo (AWS S3): requiere configuración adicional y manejo de credenciales.

## Decision 4: Frontend architecture

- Decision: React con TypeScript, contexts para estado global (Auth, Theme), hooks personalizados para lógica de negocio.
- Rationale: TypeScript provee type safety, contexts evitan prop drilling, hooks encapsulan lógica reutilizable.
- Alternatives considered:
  - Redux/Zustand: sobrecomplica para el alcance del proyecto.
  - JavaScript vanilla: perdería type safety y developer experience.

## Implementation considerations

- Usar variables de entorno para configuración de Supabase en frontend y backend.
- Implementar interceptors en axios para manejar tokens y refresh automático.
- Organizar componentes por funcionalidad (platform views, upload widget, auth).
- Aislamiento de usuarios a nivel de API queries (filtrar por user_id).

## Conclusion

Se recomienda proceder con las decisiones anteriores que han demostrado ser efectivas en la implementación completada. La arquitectura es limpia, escalable y aprovecha las fortalezas de Supabase.
