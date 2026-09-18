with source as (

    select * from {{ ref('raw_orders') }}

),

renamed as (

    select
        {{ dbt_utils.generate_surrogate_key(['order_id']) }} as order_sk,
        order_id,
        customer_id,
        cast(order_date as date) as order_date,
        status
    from source

)

select * from renamed