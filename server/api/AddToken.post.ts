import pg from "pg";

export default defineEventHandler(async (event) : Promise<number> => {

    const token = await readBody(event);

    const client = new pg.Client();

    await client.connect();
    
    const insTokenSql = `INSERT INTO verification_token 
                                (identifier, expires, token)
                        VALUES ('${token.id}', 
                                '${token.expire}', '${token.token}');`;
    
    const resultInsert = await client.query(insTokenSql);
                    
    if(!resultInsert){
        console.log(10);
        await client.end();
        return -1;
    }
    await client.end();

    return 1;
});