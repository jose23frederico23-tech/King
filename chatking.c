#include <stdio.h>
#include <ctype.h>
#include <locale.h>
#include <string.h>
int main() {
	setlocale(LC_ALL,"portuguese");
    int opc,opc2;
    int op,i;
    char chat[]="king";
    char enter[50];
    do {
        printf(" Oi sou '%s' um programa com a fun��o de te ajuda a crescer e ter o dom�nio da sua vida \n",chat);
        printf("\n");
        printf("1-Ver minhas capacidades.\n");
        printf("2-Altera nome do chat.\n ");
        printf("3-Sair.\n");
        scanf("%d",&op);
        switch(op){
        case 1 :
            printf("1-Criar hor�rio de estudos;\n");
            printf("2-Metodos pra aprender r�pido;\n");
            printf("3-Educa��o financeira;\n");
            printf("4-Auxilio a desenvolver autoconfian�a e autoestima.\n");
            scanf("%d",&opc);
            switch(opc) {
            case 1 :
                printf("Qual � o periodo que voc� est�s livre pra estudar? \n");
                scanf("%s",&enter);                            																				
                if(strcmp(enter,"manha") ==0|| strcmp(enter,"matinal")==0) {
                    printf("Estudar das 9h at� as 11horas.\n");
                    printf("09:00 �s 09:10\n Organiza��o r�pida\nPreparar material\nAbrir caderno/editor\nDefinir o objetivo do dia");
                    printf("\n");
                    printf("09:10 �s 09:40\nEstudo principal\nLer o conteudo novo\nAssistir a um v�deo curto\nEntender o conceito (sem decorar)");
                    printf("\n");
                    printf("09:40 �s 09:45 \n Pausa r�pida �gua, alongar, respirar e comer,\n");
                    printf("09:45-10:25 Pr�tica \n Fazer exercecios \n Escrever c�digo\n Errar e corrigir\n");
                    printf("10:25 �s 10:30\nPausa curta \n");
                    printf(" 10:30-10:55\n Revis�o inteligente anotar pontos importantes Refazer 1 exerc�cio sem olhar Resumir em poucas linhas\n");
                    printf("10:55 11:00 \nFechamento, o que aprendi hoje? que estudar amanh�?\n");

                } else if(strcmp(enter,"tarde")==0 || strcmp(enter,"tardal")==0) {
                    printf("Estudar das 16h entre 18h.\nUsando o m�todo de promodoro estudar n�o � castigo, mas sim  um presente,que nos dar� a chave do futuro\n");
                    printf("16:00 �s 16:10\nPrepara��o r�pida organizar material, definir objetivo\n");
                    printf("16:10 �s 16:50\nEstudo constante, leitura ou v�deo curto\n");
                    printf("16:50 �s 17:00\nPausa curta\n");
                    printf("17:00 �s 17:40\nPr�tica e exerc�cios constancia te torma-o mestre.\n");
                    printf("17:40 �s 17:55\nRevis�o r�pida anotar pontos-chave dos temas.\n");
                    printf("17:55 �s 18:00\nFechamento, o que aprendeu � a proxima tarefa\n");

                }
                else if(strcmp(enter,"noite")==0 || strcmp(enter,"noturno")==0 )
                {
                    printf("Das 20h at� �s 22horas\n");
                    printf("20h20 �s 20h50\nRevis�o r�pida de conteudos importantes.\n");
                    printf("20h50 �s 21h20\nExerc�cios pr�ticos e resolus�o de problemas\n");
                    printf("21h20 �s 21h50\nResumos ou mapas mentais e fixa��o r�pida\n");
                    printf("21h50 �s 22h00\nPlanejamento do proximo dia de estudo e encerramento\n");
                }
                else {
                    printf("Erro tente novamente \n");

                }
                break;
            case 2 :
                printf("Os m�todos pra aprender em um flash s�o:\n");
                printf("1-Prom�doro\n");
                printf("2-Feynman\n");
                printf("3-Active Recall\n");
                printf("4-Spaced Repetition\n");
                printf("5-Interleaving\n");
                printf("Escolha um pra  dar in�cio a evolu��o\n");
                scanf("%d",&opc2);

                switch(opc2) {

                case 1 :
                    printf("Consiste em estudar 15 minutos e descansar 5 minuto;s\n");
                    printf("A bom,pra quem t�m pouco tempo para estudar;\n E sem si cansar muito.");

                    break;

                case 2  :
                    printf("Escolher um tema;\n");
                    printf("Explique como se estivesse ensinando a um criança;\n");
                    printf("For�a o c�rebro a entender de verdade,n�o a decorar.\n");
                    break;
                case 3 :
                    printf("Estudar o conteudio;\n");
                    printf("Feche tudo;\n");
                    printf("Tente lembrar e escrever o que aprender,sem consultar o material;\n");
                    printf("O c�rebro aprende melhor quando puxa a informa��o.N�o s� quando l�.\n");
                    break;

                case 4 :
                    printf("Rev�s�o do conteudo em intervalos crescentes;\n");
                    printf(" 1dia � 3dias � 6dias � 8dias � 12dias\n");
                    printf("Combate o esquecimento natural do c�rebro.\n");

                    break;
                case 5 :

                    printf("Estuda assuntos diferentes na mesma sess�o\n");
                    printf("Melhora a capacidade de diferenciar conceitos.\n");

                    break;
                default :
                    printf("Tente novamente\n");
                    break;

                };
                break;
            case 3:
                printf("Tudo que voc� precisa saber sobre finan�as \n");
                printf("Educa��o Financeira\n");
                printf("O que �:\nSaber controlar dinheiro, gastar menos do que ganha e investir para aumentar riqueza ao longo do tempo.\n");

                printf("Regras b�sicas:\n");
                printf("1-Gaste menos do que ganha\n2-Tenha uma reserva de emerg�ncia (3 � 6 meses de despesas)\n");
                printf("3-Evite d�vidas ruins com juros altos, cart�o de cr�dito, empr�stimos desnecess�rios\n");
                printf("4-Planeje seus gastos mensal\n");
                printf("Ativos vs Passivos:\n");
                printf("Ativo: coloca dinheiro no seu bolso. Ex: investimentos, aluguel recebido, neg�cios que geram lucro.\n");
                printf("Passivo: tira dinheiro do seu bolso. Ex: carro caro que s�o gasto manuten��o, d�vidas, coisas que depreciam.\n");
                printf("Investir:\n");
                printf("Pouco a pouco, o dinheiro cresce com juros ou valoriza��o.\nTipos: fundos, imveis, tesouro direto.\n");
                printf("Objetivo:\n");
                printf("Transformar passivos em ativos, gastar menos do que ganha e fazer o dinheiro trabalhar para voc� e n�o o contr�rio\n");
                break;
            case 4 :
                printf("Tudo que voc� precisa saber sobre autoconfian�a e autodisciplina :\n");
                printf("Pra ter ou desenvolver autoconfian�a ou autodisciplina voc� deve ter for�a de vontade.\n");
                printf("Eu vou te ajudar a  ter autoconfian�a e autodisciplina na escola e  na vida\n");
                printf("Como desenvolver autoconfian�a\nEstudar um pouco todos os dias progresso constante\n");
                printf("Definir metas pequenas e alcan�aveis.\n");
                printf("Reconhecer erros como parte do aprendizado.\n");
                printf("Comparar-se apenas com seu pr�prio progresso.\n");
                printf("Praticar e revisar o conte�do com frequ�ncia.\n");
                printf("Como desenvolver autodisciplina.\n");
                printf("Criar um hor�rio fixo de estudos.\n");
                printf("Estudar mesmo sem motiva��o inicial.\n");
                printf("Evitar distra��es ,celular, redes sociais\n");
                printf("Priorizar tarefas importantes.\n");
                printf("Manter rotina e const�ncia\n");
                break;

            default :
                printf("Erro tente novamente.\n");
                break;
            };

            break;
        case 2 :
            printf("Escreva o novo nome:");
            scanf("%s",&chat);
            break;
        case 3 :
            printf("Saindo.. ");
            break;
        default :
            printf("Erro tente novamente.\n");
            break;
        };
    } while(op!=3);
    return 0;
}