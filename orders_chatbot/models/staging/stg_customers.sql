with source as (

    select * from {{ ref('raw_customers') }}

),

renamed as (

    select
        {{ dbt_utils.generate_surrogate_key(['customer_id']) }} as customer_sk,
        customer_id,
        first_name,
        segment,
        region,
        cast(signup_date as date) as signup_date
    from source

)

select * from renamed