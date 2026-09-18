with source as (

    select * from {{ ref('raw_order_items') }}

),

renamed as (

    select
        {{ dbt_utils.generate_surrogate_key(['item_id']) }} as order_item_sk,
        item_id,
        order_id,
        product_name,
        category,
        cast(price as numeric) as price,
        cast(quantity as numeric) as quantity
    from source

)

select * from renamed