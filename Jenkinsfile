pipeline {
    agent any
    options {
        timeout(time: 20, unit: 'MINUTES')   // kills the whole build if it exceeds this
    }
    environment {
        PROJECT_NAME     = "todo-backend"
        DOCKER_IMAGE     = "ritanshbagal/todo-backend"
        DOCKER_TAG       = "${BUILD_NUMBER}"
        EC2_HOST         = "3.110.55.59"
        EC2_USER         = "ubuntu"
        DOCKER_CONTAINER = "todo-backend"
        APP_PORT         = "8082:8080"
    }
    stages {
        stage("Checkout") {
            steps {
                checkout scm
                echo "checkout successful"
            }
        }

        stage("Test") {
            steps {
                sh '''
                chmod +x ./mvnw
                ./mvnw -B test
                '''
            }
        }

        stage("Build") {
            steps {
                sh './mvnw -B clean package -DskipTests'
            }
        }

        stage("Docker Build") {
            steps {
                sh 'docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .'
            }
        }

        stage("Docker Push") {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-credentials',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_PASSWORD'
                    )
                ]) {
                    sh '''
                    echo "$DOCKERHUB_PASSWORD" | docker login -u "$DOCKERHUB_USERNAME" --password-stdin
                    docker push ${DOCKER_IMAGE}:${DOCKER_TAG}
                    docker image prune -af
                    docker images
                    '''
                }
            }
        }

        stage("EC2 Deploy") {
            steps {
                sshagent(['ec2-instance-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                            docker rm -f ${DOCKER_CONTAINER} || true
                            docker pull ${DOCKER_IMAGE}:${DOCKER_TAG}
                            docker run -d \\
                              --name ${DOCKER_CONTAINER} \\
                              -p ${APP_PORT} \\
                              --restart unless-stopped \\
                              ${DOCKER_IMAGE}:${DOCKER_TAG}
                            docker image prune -f
                        '
                    """
                }
            }
        }
    }
}