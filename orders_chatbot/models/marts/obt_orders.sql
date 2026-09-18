

{{ config(materialized='table') }}

with order_items as (

    select * from {{ ref('stg_order_items') }}

),

orders as (

    select * from {{ ref('stg_orders') }}

),

customers as (

    select * from {{ ref('stg_customers') }}

),

joined as (

    select
        order_items.order_item_sk,
        order_items.item_id,
        order_items.product_name,
        order_items.category,
        order_items.price,
        order_items.quantity,
        order_items.price * order_items.quantity as line_item_revenue,

        orders.order_id,
        orders.order_date,
        orders.status as order_status,

        customers.customer_id,
        customers.first_name,
        customers.segment,
        customers.region,
        customers.signup_date,

        row_number() over (
            partition by orders.order_id
            order by order_items.item_id
        ) = 1 as is_first_item_in_order

    from order_items
    left join orders on order_items.order_id = orders.order_id
    left join customers on orders.customer_id = customers.customer_id

)

select * from joined