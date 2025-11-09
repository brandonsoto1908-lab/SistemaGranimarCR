// Script para arreglar los datos de materiales
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vavlehrkorioncfloedn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdmxlaHJrb3Jpb25jZmxvZWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODkwODYsImV4cCI6MjA3NzI2NTA4Nn0.DvnjmClDEFLVieURMJv6oZES711kJPC4G3ajwsJJgJ4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixMaterialesData() {
  console.log('🔧 Iniciando corrección de datos de materiales...\n')

  try {
    // 1. Obtener todos los materiales
    const { data: materiales, error: fetchError } = await supabase
      .from('materiales')
      .select('*')

    if (fetchError) throw fetchError

    console.log(`📊 Encontrados ${materiales.length} materiales\n`)

    // 2. Actualizar cada material con valores por defecto si son nulos
    for (const material of materiales) {
      const updates = {}
      let needsUpdate = false

      // Si no tiene categoría, asignarle "Láminas"
      if (!material.categoria) {
        updates.categoria = 'Láminas'
        needsUpdate = true
      }

      // Si no tiene unidad_medida, asignarle "láminas"
      if (!material.unidad_medida) {
        updates.unidad_medida = 'láminas'
        needsUpdate = true
      }

      // Si cantidad_actual es null, poner 0
      if (material.cantidad_actual === null || material.cantidad_actual === undefined) {
        updates.cantidad_actual = 0
        needsUpdate = true
      }

      // Si cantidad_minima es null, poner 2
      if (material.cantidad_minima === null || material.cantidad_minima === undefined) {
        updates.cantidad_minima = 2
        needsUpdate = true
      }

      // Si precio_unitario es null, poner un precio por defecto
      if (material.precio_unitario === null || material.precio_unitario === undefined) {
        updates.precio_unitario = 0
        needsUpdate = true
      }

      if (needsUpdate) {
        console.log(`✏️  Actualizando: ${material.nombre}`)
        console.log(`   Cambios:`, updates)

        const { error: updateError } = await supabase
          .from('materiales')
          .update(updates)
          .eq('id', material.id)

        if (updateError) {
          console.error(`   ❌ Error:`, updateError.message)
        } else {
          console.log(`   ✅ Actualizado correctamente\n`)
        }
      } else {
        console.log(`✓ ${material.nombre} - OK (no requiere cambios)`)
      }
    }

    console.log('\n✅ Proceso completado!')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixMaterialesData()
