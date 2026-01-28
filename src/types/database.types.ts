export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      materiales: {
        Row: {
          id: string
          nombre: string
          categoria: string | null
          unidad_medida: string | null
          cantidad_actual: number
          cantidad_minima: number | null
          precio_unitario: number | null
          proveedor_id: string | null
          ubicacion_fisica: string | null
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          categoria?: string | null
          unidad_medida?: string | null
          cantidad_actual?: number
          cantidad_minima?: number | null
          precio_unitario?: number | null
          proveedor_id?: string | null
          ubicacion_fisica?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          categoria?: string | null
          unidad_medida?: string | null
          cantidad_actual?: number
          cantidad_minima?: number | null
          precio_unitario?: number | null
          proveedor_id?: string | null
          ubicacion_fisica?: string | null
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      materiales_movimientos: {
        Row: {
          id: string
          material_id: string
          tipo_movimiento: string
          cantidad: number
          precio_unitario: number | null
          motivo: string | null
          referencia: string | null
          usuario: string | null
          created_at: string
        }
        Insert: {
          id?: string
          material_id: string
          tipo_movimiento: string
          cantidad: number
          precio_unitario?: number | null
          motivo?: string | null
          referencia?: string | null
          usuario?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          material_id?: string
          tipo_movimiento?: string
          cantidad?: number
          precio_unitario?: number | null
          motivo?: string | null
          referencia?: string | null
          usuario?: string | null
          created_at?: string
        }
      }
      discos: {
        Row: {
          id: string
          nombre: string
          tipo: string
          material_compatible: string | null
          cantidad: number
          marca: string | null
          diametro: number | null
          espesor: number | null
          descripcion_detallada: string | null
          ubicacion_fisica: string | null
          notas: string | null
          imagenes: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nombre: string
          tipo: string
          material_compatible?: string | null
          cantidad?: number
          marca?: string | null
          diametro?: number | null
          espesor?: number | null
          descripcion_detallada?: string | null
          ubicacion_fisica?: string | null
          notas?: string | null
          imagenes?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          tipo?: string
          material_compatible?: string | null
          cantidad?: number
          marca?: string | null
          diametro?: number | null
          espesor?: number | null
          descripcion_detallada?: string | null
          ubicacion_fisica?: string | null
          notas?: string | null
          imagenes?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      discos_movimientos: {
        Row: {
          id: string
          disco_id: string
          tipo_movimiento: string
          cantidad: number
          motivo: string | null
          proyecto: string | null
          usuario: string | null
          created_at: string
        }
        Insert: {
          id?: string
          disco_id: string
          tipo_movimiento: string
          cantidad: number
          motivo?: string | null
          proyecto?: string | null
          usuario?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          disco_id?: string
          tipo_movimiento?: string
          cantidad?: number
          motivo?: string | null
          proyecto?: string | null
          usuario?: string | null
          created_at?: string
        }
      }
      proveedores: {
        Row: {
          id: string
          nombre: string
          contacto: string | null
          telefono: string | null
          email: string | null
          direccion: string | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          nombre: string
          contacto?: string | null
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          nombre?: string
          contacto?: string | null
          telefono?: string | null
          email?: string | null
          direccion?: string | null
          notas?: string | null
          created_at?: string
        }
      }
      gastos: {
        Row: {
          id: string
          concepto: string
          categoria: string | null
          monto: number
          es_fijo: boolean
          is_planilla: boolean | null
          frecuencia_pago: string | null
          proxima_fecha_pago: string | null
          fecha: string
          mes: number
          anio: number
          proveedor_id: string | null
          notas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          concepto: string
          categoria?: string | null
          monto: number
          es_fijo?: boolean
          is_planilla?: boolean
          frecuencia_pago?: string | null
          proxima_fecha_pago?: string | null
          fecha: string
          mes: number
          anio: number
          proveedor_id?: string | null
          notas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          concepto?: string
          categoria?: string | null
          monto?: number
          es_fijo?: boolean
          is_planilla?: boolean
          frecuencia_pago?: string | null
          proxima_fecha_pago?: string | null
          fecha?: string
          mes?: number
          anio?: number
          proveedor_id?: string | null
          notas?: string | null
          created_at?: string
        }
      }
      produccion: {
        Row: {
          id: string
          codigo_sobre: string
          cliente: string
          tipo_material: string | null
          metros_lineales: number
          fecha_produccion: string
          mes: number
          anio: number
          costo_materiales: number
          costo_mano_obra: number
          costo_fijo_asignado: number
          costo_total: number
          estado: string
          notas: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo_sobre: string
          cliente: string
          tipo_material?: string | null
          metros_lineales?: number
          fecha_produccion: string
          mes: number
          anio: number
          costo_materiales?: number
          costo_mano_obra?: number
          costo_fijo_asignado?: number
          estado?: string
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo_sobre?: string
          cliente?: string
          tipo_material?: string | null
          metros_lineales?: number
          fecha_produccion?: string
          mes?: number
          anio?: number
          costo_materiales?: number
          costo_mano_obra?: number
          costo_fijo_asignado?: number
          estado?: string
          notas?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      retiros: {
        Row: {
          id: string
          material_id: string
          tipo_retiro: string | null
          cantidad_laminas: number | null
          metros_lineales: number | null
          largo_metros: number | null
          ancho_metros: number | null
          proyecto: string | null
          cliente: string | null
          usuario: string | null
          descripcion: string | null
          costo_total: number | null
          precio_venta_total: number | null
          precio_cobrado_total: number | null
          ganancia: number | null
          uso_sobrantes: boolean | null
          retiro_origen_id: string | null
          fecha_retiro: string | null
          created_at: string
        }
        Insert: {
          id?: string
          material_id: string
          tipo_retiro?: string | null
          cantidad_laminas?: number | null
          metros_lineales?: number | null
          largo_metros?: number | null
          ancho_metros?: number | null
          proyecto?: string | null
          cliente?: string | null
          usuario?: string | null
          descripcion?: string | null
          costo_total?: number | null
          precio_venta_total?: number | null
          precio_cobrado_total?: number | null
          ganancia?: number | null
          uso_sobrantes?: boolean | null
          retiro_origen_id?: string | null
          fecha_retiro?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          material_id?: string
          tipo_retiro?: string | null
          cantidad_laminas?: number | null
          metros_lineales?: number | null
          largo_metros?: number | null
          ancho_metros?: number | null
          proyecto?: string | null
          cliente?: string | null
          usuario?: string | null
          descripcion?: string | null
          costo_total?: number | null
          precio_venta_total?: number | null
          precio_cobrado_total?: number | null
          ganancia?: number | null
          uso_sobrantes?: boolean | null
          retiro_origen_id?: string | null
          fecha_retiro?: string | null
          created_at?: string
        }
      }
    }
    Functions: {
      calcular_costo_fijo_por_metro: {
        Args: {
          p_year: number
          p_month: number
          p_metros_lineales: number
        }
        Returns: number
      }
      totales_fijos_produccion: {
        Args: {
          p_year: number
          p_month: number
        }
        Returns: {
          total_gastos_fijos: number
          total_metros_producidos: number
          costo_por_metro: number
        }[]
      }
    }
  }
}
