pipeline {
    agent any
    options {
        timeout(time: 20, unit: 'MINUTES')   // kills the whole build if it exceeds this
    }
    environment {
        PROJECT_NAME = "todo-backend"
        DOCKER_IMAGE = "ritanshbagal/todo-backend"
        DOCKER_TAG = "${BUILD_NUMBER}"
    }
    stages {
        stage("Checkout"){
            steps{
                checkout scm
                echo "checkout successful"
            }
        }
        stage("Test"){
            steps{
                sh '''
                chmod +x ./mvnw
                ./mvnw -B test
                '''
            }
        }
        stage("Build"){
            steps{
                sh './mvnw -B clean package -DskipTests'
            }
        }
        stage("Docker Build"){
            steps{
                sh 'docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .'
            }
        }
        stage("Docker Push"){
            steps{

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_PASSWORD'
                    )
                ]){
                    sh '''

                    echo "$DOCKERHUB_PASSWORD | docker login -u $DOCKERHUB_USERNAME --password-stdin"
                    docker push ${DOCKER_IMAGE}:${dOCKER_TAG}
                    docker image prune -af
                    docker images
                    '''
                }
            }
        }
    }
}