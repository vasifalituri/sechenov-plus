import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, MessageSquare, Users, TrendingUp, Download, Shield, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div 
      className="min-h-screen relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.75), rgba(249, 250, 251, 0.85)), url(/images/background.jpg)',
      }}
    >
      <div className="relative z-10">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-block">
            <span className="px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium">
              Образовательная платформа
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
            Sechenov<span className="text-blue-600">+</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Платформа для медицинских студентов
          </p>
          
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
            Делитесь материалами, обсуждайте экзамены и готовьтесь вместе с тысячами студентов медицинских университетов
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                Начать бесплатно
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
                Войти
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="space-y-4">
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Сложно готовиться к экзаменам в одиночку?
            </p>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Нужны проверенные материалы и опыт старшекурсников?
            </p>
          </div>
          
          <div className="pt-8">
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-blue-600 dark:bg-blue-700 text-white rounded-lg">
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg font-medium">
                Sechenov+ объединяет студентов для совместной подготовки
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Всё для успешной подготовки
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="border-2 hover:border-blue-500 dark:hover:border-blue-600 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Библиотека материалов</CardTitle>
              <CardDescription>
                Лекции, конспекты и учебники по всем предметам
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Фильтрация по курсам и предметам
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Проверенные материалы
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Скачивание PDF и DOCX
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500 dark:hover:border-blue-600 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Обсуждения экзаменов</CardTitle>
              <CardDescription>
                Реальный опыт и советы от студентов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Вопросы и ответы
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Опыт старшекурсников
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Система лайков и закреплений
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-blue-500 dark:hover:border-blue-600 transition-colors">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Активное сообщество</CardTitle>
              <CardDescription>
                Студенты медицинских университетов
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Все курсы (1-6)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Модерация контента
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Безопасная среда
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
          Как это работает
        </h2>
        
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 dark:bg-blue-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
              1
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Регистрация</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Создайте аккаунт за 2 минуты. Укажите курс и университет
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 dark:bg-blue-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
              2
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Выбор предмета</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Найдите нужный предмет и курс в библиотеке
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 dark:bg-blue-700 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
              3
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Готовьтесь</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Скачивайте материалы, участвуйте в обсуждениях
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">18+</div>
            <p className="text-gray-600 dark:text-gray-400">Предметов в каталоге</p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">6</div>
            <p className="text-gray-600 dark:text-gray-400">Курсов обучения</p>
          </div>
          <div className="space-y-2">
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
            <p className="text-gray-600 dark:text-gray-400">Доступ к материалам</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-blue-600 dark:bg-blue-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Готовы начать?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Присоединяйтесь к сообществу студентов медицинских университетов
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Создать аккаунт бесплатно
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Sechenov+</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Образовательная платформа для медицинских студентов
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Ссылки</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/login" className="hover:text-blue-600 dark:hover:text-blue-400">Войти</Link></li>
                <li><Link href="/register" className="hover:text-blue-600 dark:hover:text-blue-400">Регистрация</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Информация</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>О проекте</li>
                <li>Правила использования</li>
              </ul>
            </div>
          </div>
          <div className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              © 2026 Sechenov+. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
