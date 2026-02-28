
import pkg from 'pg';
const { Client } = pkg;

async function main() {
    const client = new Client({
        connectionString: "postgresql://postgres.ranhzqebkypwlcvqkyae:4Qd4IhbfMpSysft8@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
    });
    try {
        await client.connect();
        const res = await client.query('SELECT * FROM case_types');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
