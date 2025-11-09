// Script para verificar la estructura de la tabla materiales
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vavlehrkorioncfloedn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdmxlaHJrb3Jpb25jZmxvZWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2ODkwODYsImV4cCI6MjA3NzI2NTA4Nn0.DvnjmClDEFLVieURMJv6oZES711kJPC4G3ajwsJJgJ4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMaterialesStructure() {
  console.log('🔍 Verificando estructura de materiales...\n')

  try {
    const { data, error } = await supabase
      .from('materiales')
      .select('*')
      .limit(1)

    if (error) throw error

    if (data && data.length > 0) {
      console.log('📋 Columnas encontradas:')
      console.log(Object.keys(data[0]))
      console.log('\n📝 Ejemplo de datos:')
      console.log(JSON.stringify(data[0], null, 2))
    } else {
      console.log('⚠️  No hay datos en la tabla')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkMaterialesStructure()
