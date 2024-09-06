import TipoMaquinario from "../Modelo/TipoMaquinario.js";
import conectar from "./conexao.js";
//DAO = Data Access Object -> Objeto de acesso aos dados
export default class TipoMaquinarioDAO{

    constructor() {
        this.init();
    }
    
    async init() {
        try 
        {
            const conexao = await conectar(); //retorna uma conexão
            const sql = `
                CREATE TABLE IF NOT EXISTS tipo_maquinario(
                    tpm_codigo INT NOT NULL AUTO_INCREMENT,
                    tpm_descricao VARCHAR(100) NOT NULL,
                    CONSTRAINT pk_tipo_maquinario PRIMARY KEY(tpm_codigo)
                );`;
            await conexao.execute(sql);
            await conexao.release();
        }
        catch (e) {
            console.log("Não foi possível iniciar o banco de dados: " + e.message);
        }
    }
    async gravar(tipoMaquinario){
        if (tipoMaquinario instanceof TipoMaquinario){
            const sql = "INSERT INTO tipo_maquinario(tpm_descricao) VALUES(?)"; 
            const parametros = [tipoMaquinario.descricao];
            const conexao = await conectar(); //retorna uma conexão
            const retorno = await conexao.execute(sql,parametros); //prepara a sql e depois executa
            tipoMaquinario.codigo = retorno[0].insertId;
            global.poolConexoes.releaseConnection(conexao);
        }
    }

    async atualizar(tipoMaquinario){
        if (tipoMaquinario instanceof TipoMaquinario){
            const sql = "UPDATE tipo_maquinario SET tpm_descricao = ? WHERE tpm_codigo = ?"; 
            const parametros = [tipoMaquinario.descricao, tipoMaquinario.codigo];
            const conexao = await conectar(); //retorna uma conexão
            await conexao.execute(sql,parametros); //prepara a sql e depois executa
            global.poolConexoes.releaseConnection(conexao);
        }
    }

    async excluir(tipoMaquinario){
        if (tipoMaquinario instanceof TipoMaquinario){
            //Excluir tipo de maquinário implica em excluir também os maquinários associados
            // caso contrario, haverá uma violação de integridade referencial no banco de dados
            // essa restrição deve ser implementada na lógica de negócio da sua aplicação.
            const sql = "DELETE FROM tipo_maquinario WHERE tpm_codigo = ?"; 
            const parametros = [tipoMaquinario.codigo];
            const conexao = await conectar(); //retorna uma conexão
            await conexao.execute(sql,parametros); //prepara a sql e depois executa
            global.poolConexoes.releaseConnection(conexao);
        }
    }

    async consultar(parametroConsulta){
        let sql='';
        let parametros=[];
        //é um número inteiro?
        if (!isNaN(parseInt(parametroConsulta))){
            //consultar pelo código da categoria
            sql='SELECT * FROM tipo_maquinario WHERE tpm_codigo = ? order by tpm_descricao';
            parametros = [parametroConsulta];
        }
        else{
            //consultar pela descricao
            if (!parametroConsulta){
                parametroConsulta = '';
            }
            sql = "SELECT * FROM tipo_maquinario WHERE tpm_descricao like ?";
            parametros = ['%'+parametroConsulta+'%'];
        }
        const conexao = await conectar();
        const [registros, campos] = await conexao.execute(sql,parametros);
        let listaTipoMaquinario = [];
        for (const registro of registros){
            const tipoMaquinario = new TipoMaquinario(registro.tpm_codigo,registro.tpm_descricao);
            listaTipoMaquinario.push(tipoMaquinario);
        }
        return listaTipoMaquinario;
    }

    async possuiMaquinario(codigo){
        if (tipoMaquinario instanceof TipoMaquinario){
            const sql = `SELECT COUNT(*) AS qtd FROM maquinario m
                         INNER JOIN tipo_maquinario t ON m.tpm_codigo = t.tpm_codigo
                         WHERE t.tpm_codigo = ?`;

            const parametros = [codigo];
            const [registros] = await global.poolConexoes.execute(sql,parametros);
            return registros[0].qtd > 0;
        }
    }
}